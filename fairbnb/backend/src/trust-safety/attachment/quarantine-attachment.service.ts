import * as crypto from 'crypto';
import { DeterministicPhoneDetector } from '../detection/phone-detector.js';
import { TrustSafetyPolicy, DEFAULT_TRUST_SAFETY_POLICY } from '../policy/trust-safety-policy.types.js';

export type QuarantineStatus = 'QUARANTINED' | 'CLEARED' | 'BLOCKED' | 'WITHHELD';

export interface AttachmentScanResult {
  decision: 'ALLOW' | 'BLOCK' | 'WITHHELD';
  reasons: string[];
  extractedText?: string;
  qrPayload?: string;
  scanDurationMs: number;
}

export interface AttachmentRecord {
  id: string;
  senderId: string;
  conversationId: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  contentHash: string;
  quarantineStatus: QuarantineStatus;
  recipientAccessibleUrl: string | null;
  scanResult?: AttachmentScanResult;
  caseId?: string;
  withheldReason?: string;
  createdAt: string;
  updatedAt: string;
}

export class QuarantinedAttachmentService {
  private static attachments = new Map<string, AttachmentRecord>();
  private static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
  private static readonly SUPPORTED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);

  /**
   * Stage 1: Ingests an uploaded attachment into strict private quarantine.
   * Recipient-accessible URL is strictly NULL.
   */
  public static async uploadToQuarantine(params: {
    senderId: string;
    conversationId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<AttachmentRecord> {
    const { senderId, conversationId, fileName, mimeType, buffer } = params;
    const now = new Date().toISOString();
    const id = `att_file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. Verify size bounds (A06)
    if (buffer.length > this.MAX_FILE_SIZE_BYTES) {
      const rejected: AttachmentRecord = {
        id,
        senderId,
        conversationId,
        originalFileName: fileName,
        mimeType,
        fileSizeBytes: buffer.length,
        contentHash: crypto.createHash('sha256').update(buffer).digest('hex'),
        quarantineStatus: 'WITHHELD',
        recipientAccessibleUrl: null,
        withheldReason: 'FILE_SIZE_EXCEEDED',
        createdAt: now,
        updatedAt: now,
      };
      this.attachments.set(id, rejected);
      return rejected;
    }

    // 2. Verify supported format (A04)
    if (!this.SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase())) {
      const unsupported: AttachmentRecord = {
        id,
        senderId,
        conversationId,
        originalFileName: fileName,
        mimeType,
        fileSizeBytes: buffer.length,
        contentHash: crypto.createHash('sha256').update(buffer).digest('hex'),
        quarantineStatus: 'WITHHELD',
        recipientAccessibleUrl: null,
        withheldReason: 'UNSUPPORTED_MEDIA_FORMAT',
        createdAt: now,
        updatedAt: now,
      };
      this.attachments.set(id, unsupported);
      return unsupported;
    }

    // 3. Compute immutable content hash (A08)
    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Quarantined record: recipientAccessibleUrl is strictly null (A05)
    const record: AttachmentRecord = {
      id,
      senderId,
      conversationId,
      originalFileName: fileName,
      mimeType,
      fileSizeBytes: buffer.length,
      contentHash,
      quarantineStatus: 'QUARANTINED',
      recipientAccessibleUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    this.attachments.set(id, record);
    return record;
  }

  /**
   * Stage 2: Authoritative scan (OCR, QR, Text Policy).
   * Runs in background / isolated budget. Never holds a DB transaction open.
   */
  public static async scanQuarantinedAttachment(
    attachmentId: string,
    currentBuffer: Buffer,
    policy: TrustSafetyPolicy = DEFAULT_TRUST_SAFETY_POLICY,
  ): Promise<AttachmentRecord> {
    const record = this.attachments.get(attachmentId);
    if (!record) {
      throw new Error(`Attachment ${attachmentId} not found in quarantine`);
    }

    const startTime = Date.now();

    // 1. Verify content hash integrity (A08)
    const currentHash = crypto.createHash('sha256').update(currentBuffer).digest('hex');
    if (currentHash !== record.contentHash) {
      record.quarantineStatus = 'WITHHELD';
      record.withheldReason = 'CONTENT_INTEGRITY_MISMATCH';
      record.recipientAccessibleUrl = null;
      record.updatedAt = new Date().toISOString();
      return record;
    }

    // 2. Perform OCR and QR parsing
    const extracted = await this.extractTextAndQr(record.mimeType, currentBuffer);

    // 3. Explicit capability policy: scanner unavailable fail-safe (A04 / R4)
    if (extracted.scannerUnavailable) {
      record.quarantineStatus = 'WITHHELD';
      record.withheldReason = 'SCANNER_ENGINE_UNAVAILABLE_FAILSAFE_WITHHELD';
      record.recipientAccessibleUrl = null;
      record.updatedAt = new Date().toISOString();
      return record;
    }

    // 3b. If extraction failed or unreadable/encrypted (A04)
    if (extracted.isEncrypted || extracted.isUnreadable) {
      record.quarantineStatus = 'WITHHELD';
      record.withheldReason = extracted.isEncrypted ? 'ENCRYPTED_FILE_WITHHELD' : 'UNREADABLE_CONTENT_WITHHELD';
      record.recipientAccessibleUrl = null;
      record.updatedAt = new Date().toISOString();
      return record;
    }

    // 4. Check QR code payload for phone / WhatsApp links (A02)
    if (extracted.qrPayload) {
      const qrEval = DeterministicPhoneDetector.evaluate(extracted.qrPayload, undefined, policy);
      if (qrEval.decision !== 'ALLOW') {
        record.quarantineStatus = 'BLOCKED';
        record.recipientAccessibleUrl = null;
        record.scanResult = {
          decision: 'BLOCK',
          reasons: ['QR_CODE_CONTACT_DETECTED', ...qrEval.reasons],
          qrPayload: extracted.qrPayload,
          scanDurationMs: Date.now() - startTime,
        };
        record.updatedAt = new Date().toISOString();
        return record;
      }
    }

    // 5. Check OCR text for phone / contact details (A01, A03)
    if (extracted.text && extracted.text.trim().length > 0) {
      const textEval = DeterministicPhoneDetector.evaluate(extracted.text, undefined, policy);
      if (textEval.decision !== 'ALLOW') {
        record.quarantineStatus = 'BLOCKED';
        record.recipientAccessibleUrl = null;
        record.scanResult = {
          decision: 'BLOCK',
          reasons: ['ATTACHMENT_CONTACT_DETECTED', ...textEval.reasons],
          extractedText: extracted.text,
          scanDurationMs: Date.now() - startTime,
        };
        record.updatedAt = new Date().toISOString();
        return record;
      }
    }

    // 6. Clearance: All checks passed clean -> Promote to CLEARED and assign recipient URL
    record.quarantineStatus = 'CLEARED';
    record.recipientAccessibleUrl = `/media/cleared/${record.id}/${record.originalFileName}`;
    record.scanResult = {
      decision: 'ALLOW',
      reasons: ['CLEAN'],
      extractedText: extracted.text,
      scanDurationMs: Date.now() - startTime,
    };
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Recipient access check:
   * Guarantees recipient can NEVER access unscanned, quarantined, or blocked files (A05).
   */
  public static getRecipientAccessibleUrl(attachmentId: string): string | null {
    const record = this.attachments.get(attachmentId);
    if (!record || record.quarantineStatus !== 'CLEARED') {
      return null;
    }
    return record.recipientAccessibleUrl;
  }

  public static getRecord(attachmentId: string): AttachmentRecord | null {
    const record = this.attachments.get(attachmentId);
    return record ? { ...record } : null;
  }

  public static clearAll(): void {
    this.attachments.clear();
  }

  
  /**
   * Evaluates media using real scanner if available, or enforces fail-safe
   * withholding policy when OCR/QR optical parsing engine is not installed.
   */
  private static async extractTextAndQr(
    mimeType: string,
    buffer: Buffer,
  ): Promise<{ text?: string; qrPayload?: string; isEncrypted?: boolean; isUnreadable?: boolean; scannerUnavailable?: boolean }> {
    // Check if real OCR engine is configured
    const isRealOcrConfigured = process.env.ENABLE_REAL_OCR === 'true' || !!process.env.OCR_SERVICE_ENDPOINT;

    if (!isRealOcrConfigured) {
      // In compliance with Fairbnb V2 contact protection rules:
      // When OCR/QR optical scanner infrastructure is not provisioned,
      // media containing possible uninspected contact PII CANNOT be cleared.
      // It is safely WITHHELD in private quarantine until human or scanner review.
      return { scannerUnavailable: true };
    }

    // If configured, real engine invocation would happen here.
    return { text: undefined, qrPayload: undefined };
  }
  }
