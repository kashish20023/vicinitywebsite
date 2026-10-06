import { Injectable, Logger, Optional, ServiceUnavailableException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface CashfreeConfig {
  appId?: string;
  secretKey?: string;
  pgApiVersion?: string;
  environment?: 'SANDBOX' | 'PRODUCTION' | 'MOCK' | 'DISABLED';
  payoutsEnabled?: boolean;
}

export interface CashfreeOrderInput {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerDetails: {
    customerId: string;
    customerEmail?: string;
    customerPhone?: string;
    customerName?: string;
  };
  orderNote?: string;
}

export interface CashfreeRefundInput {
  refundId: string;
  orderId: string;
  refundAmount: number;
  refundNote?: string;
  refundSpeed?: 'STANDARD' | 'INSTANT';
}

export interface CashfreeTransferInput {
  transferId: string;
  amount: number;
  currency: string;
  beneficiaryId: string;
  transferMode?: 'BANKTRANSFER' | 'UPI' | 'IMPS' | 'NEFT';
  narration?: string;
}

export interface ProviderTransferResult {
  status: 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  providerReference?: string;
  failureReason?: string;
  rawResponse?: any;
  _simulated?: boolean; // true when this result came from MOCK simulation — NOT real funds
}

@Injectable()
export class CashfreeProvider {
  private readonly logger = new Logger(CashfreeProvider.name);
  private readonly config: CashfreeConfig;

  // In-memory token cache for Payouts API Bearer token.
  // Tokens are short-lived (typically 30min); refresh with 60s buffer.
  private payoutsTokenCache: {
    token: string;
    expiresAt: number; // unix ms
  } | null = null;

  constructor(@Optional() customConfig?: CashfreeConfig) {
    this.config = customConfig || {
      appId: process.env.CASHFREE_APP_ID,
      secretKey: process.env.CASHFREE_SECRET_KEY,
      pgApiVersion: process.env.CASHFREE_API_VERSION || '2023-08-01',
      environment: (process.env.CASHFREE_ENV as any) || 'MOCK',
      payoutsEnabled: process.env.CASHFREE_PAYOUTS_ENABLED !== 'false',
    };

    // Log the effective mode at startup (without credentials)
    this.logger.log(
      `CashfreeProvider initialized: env=${this.config.environment}, ` +
      `payoutsEnabled=${this.config.payoutsEnabled}, ` +
      `credentials=${this.config.appId ? 'PRESENT' : 'ABSENT'}`,
    );
  }

  getEnvironment(): 'SANDBOX' | 'PRODUCTION' | 'MOCK' | 'DISABLED' {
    return this.config.environment || 'MOCK';
  }

  isRealGatewayConfigured(): boolean {
    return (
      Boolean(this.config.appId && this.config.secretKey) &&
      this.config.environment !== 'MOCK' &&
      this.config.environment !== 'DISABLED'
    );
  }

  /**
   * Returns true only when payouts disbursement is explicitly enabled AND credentials exist.
   * Absence of credentials or CASHFREE_PAYOUTS_ENABLED=false both block payouts.
   */
  isPayoutsEnabled(): boolean {
    return this.config.payoutsEnabled !== false && this.isRealGatewayConfigured();
  }

  guardPayoutsEnabled(): void {
    if (this.config.environment === 'DISABLED') {
      throw new ServiceUnavailableException(
        'Payout disbursement is administratively DISABLED. ' +
        'Set CASHFREE_ENV=SANDBOX|PRODUCTION and CASHFREE_PAYOUTS_ENABLED=true with valid credentials to enable.',
      );
    }
    if (this.config.payoutsEnabled === false) {
      throw new ServiceUnavailableException(
        'Payout disbursement is disabled (CASHFREE_PAYOUTS_ENABLED=false). ' +
        'Set CASHFREE_PAYOUTS_ENABLED=true to enable real transfers.',
      );
    }
  }

  /**
   * Verifies Cashfree Payment Gateway (PG) Webhook Signature.
   * Official PG specification: signature is passed in header (x-webhook-signature)
   * computed over: `${timestamp}${rawBody}` using HMAC-SHA256 with secretKey.
   * Reference: https://docs.cashfree.com/docs/pg-webhooks
   */
  verifyPgWebhookSignature(
    rawBody: string | object,
    timestamp: string,
    signature: string,
  ): boolean {
    if (!this.config.secretKey) {
      return false;
    }

    if (!timestamp || !signature) {
      return false;
    }

    try {
      const bodyStr =
        typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
      const dataToSign = `${timestamp}${bodyStr}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(dataToSign)
        .digest('base64');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch (err: any) {
      this.logger.error(`PG Webhook signature verification error: ${err.message}`);
      return false;
    }
  }

  /**
   * Verifies Cashfree Payouts Webhook V1 Signature.
   *
   * Official Documentation: https://www.cashfree.com/docs/api-reference/payouts/v2/webhooks/webhooks-v1
   *
   * Specification:
   * 1. The signature is sent INSIDE the POST body as the `signature` parameter.
   * 2. All POST parameters EXCEPT `signature` are collected into key-value pairs.
   * 3. Keys are sorted alphabetically / lexicographically (ksort).
   * 4. Values are concatenated in sorted order into a single string (postData).
   * 5. HMAC-SHA256 of `postData` is computed with the merchant's secretKey and Base64-encoded.
   * 6. Result is compared to `payload.signature` using constant-time comparison.
   *
   * Note: Payment Gateway header-based verification (x-webhook-signature over timestamp + rawBody)
   * is strictly separated from Payouts Webhook V1 verification to avoid accepting mismatched schemes.
   */
  verifyPayoutWebhookV1Signature(payload: Record<string, any>): boolean {
    if (!this.config.secretKey) {
      return false;
    }

    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const signature = payload.signature;
    if (typeof signature !== 'string' || !signature.trim()) {
      return false;
    }

    try {
      // 1. Collect all keys except 'signature' and sort lexicographically
      const sortedKeys = Object.keys(payload)
        .filter((k) => k !== 'signature')
        .sort();

      // 2. Concatenate non-empty values
      let postData = '';
      for (const key of sortedKeys) {
        const val = payload[key];
        if (val !== null && val !== undefined) {
          postData += String(val);
        }
      }

      // 3. Compute HMAC-SHA256 with secretKey, base64 encoded
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(postData)
        .digest('base64');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch (err: any) {
      this.logger.error(`Payouts Webhook V1 signature verification error: ${err.message}`);
      return false;
    }
  }

  /**
   * Helper function to compute Cashfree Payouts Webhook V1 signature for testing/fixtures.
   */
  computePayoutWebhookV1Signature(payload: Record<string, any>): string {
    if (!this.config.secretKey) {
      throw new Error('Secret key required to compute Payouts V1 signature');
    }
    const sortedKeys = Object.keys(payload)
      .filter((k) => k !== 'signature')
      .sort();
    let postData = '';
    for (const key of sortedKeys) {
      const val = payload[key];
      if (val !== null && val !== undefined) {
        postData += String(val);
      }
    }
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(postData)
      .digest('base64');
  }

  /**
   * Backward-compatible alias for PG webhook verification.
   */
  verifyWebhookSignature(
    rawBody: string | object,
    timestamp: string,
    signature: string,
  ): boolean {
    return this.verifyPgWebhookSignature(rawBody, timestamp, signature);
  }

  // ---------------------------------------------------------------------------
  // PAYMENT GATEWAY (PG) — Orders and Refunds
  // Uses header auth: x-client-id + x-client-secret + x-api-version
  // Base URLs: api.cashfree.com/pg (production) / sandbox.cashfree.com/pg (sandbox)
  // API Reference: https://docs.cashfree.com/reference/pg-new-apis-endpoint
  // ---------------------------------------------------------------------------

  /**
   * Create Payment Gateway Order.
   * Official: POST /pg/orders (API version 2023-08-01)
   */
  async createOrder(input: CashfreeOrderInput): Promise<{
    orderId: string;
    paymentSessionId: string;
    orderStatus: string;
  }> {
    if (!this.isRealGatewayConfigured()) {
      return {
        orderId: input.orderId,
        paymentSessionId: `session_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        orderStatus: 'ACTIVE',
      };
    }

    const baseUrl =
      this.config.environment === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'x-client-id': this.config.appId!,
        'x-client-secret': this.config.secretKey!,
        'x-api-version': this.config.pgApiVersion || '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: input.orderId,
        order_amount: input.orderAmount,
        order_currency: input.orderCurrency || 'INR',
        customer_details: {
          customer_id: input.customerDetails.customerId,
          customer_email: input.customerDetails.customerEmail || 'guest@fairbnb.com',
          customer_phone: input.customerDetails.customerPhone || '9999999999',
          customer_name: input.customerDetails.customerName || 'FairBnB Guest',
        },
        order_note: input.orderNote || 'FairBnB Booking Reservation',
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Cashfree createOrder failed [${res.status}]: ${errBody}`);
    }

    const data: any = await res.json();
    return {
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
    };
  }

  /**
   * Initiate PG Refund.
   * Official: POST /pg/orders/{order_id}/refunds
   */
  async createRefund(input: CashfreeRefundInput): Promise<{
    refundId: string;
    status: 'SUCCESS' | 'FAILED' | 'UNKNOWN';
    providerRefundId?: string;
    failureReason?: string;
  }> {
    if (!this.isRealGatewayConfigured()) {
      return {
        refundId: input.refundId,
        status: 'SUCCESS',
        providerRefundId: `cf_rfnd_mock_${Date.now()}`,
      };
    }

    const baseUrl =
      this.config.environment === 'PRODUCTION'
        ? `https://api.cashfree.com/pg/orders/${input.orderId}/refunds`
        : `https://sandbox.cashfree.com/pg/orders/${input.orderId}/refunds`;

    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'x-client-id': this.config.appId!,
          'x-client-secret': this.config.secretKey!,
          'x-api-version': this.config.pgApiVersion || '2023-08-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refund_amount: input.refundAmount,
          refund_id: input.refundId,
          refund_note: input.refundNote || 'Customer refund',
          refund_speed: input.refundSpeed || 'STANDARD',
        }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        return {
          refundId: input.refundId,
          status: 'FAILED',
          failureReason: data.message || `Cashfree refund failed [${res.status}]`,
        };
      }

      return {
        refundId: input.refundId,
        status: data.refund_status === 'SUCCESS' ? 'SUCCESS' : 'UNKNOWN',
        providerRefundId: data.cf_refund_id,
      };
    } catch (err: any) {
      return {
        refundId: input.refundId,
        status: 'UNKNOWN',
        failureReason: `TIMEOUT_OR_NETWORK_ERROR: ${err.message}`,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // PAYOUTS API — Beneficiary Transfers / Disbursements
  // AUTHENTICATION: Bearer token obtained from POST /payout/v1/authorize
  //   (x-client-id and x-client-secret are used ONLY for this authorize call,
  //    NOT for the actual transfer/status endpoints)
  // Base URLs: payout-api.cashfree.com (production) / payout-gamma.cashfree.com (sandbox)
  // API Reference: https://docs.cashfree.com/reference/authorization
  // ---------------------------------------------------------------------------

  /**
   * Authenticates with the Cashfree Payouts API and returns a Bearer token.
   * Tokens are cached in-memory and refreshed 60 seconds before expiry.
   *
   * Official endpoint: POST /payout/v1/authorize
   * Headers: x-client-id, x-client-secret, x-cf-signature (optional), x-request-id
   * Response: { status, message, subCode, data: { token, expiry } }
   */
  private async authenticatePayouts(): Promise<string> {
    const nowMs = Date.now();

    // Return cached token if still valid (with 60s buffer)
    if (this.payoutsTokenCache && this.payoutsTokenCache.expiresAt > nowMs + 60_000) {
      return this.payoutsTokenCache.token;
    }

    const baseUrl =
      this.config.environment === 'PRODUCTION'
        ? 'https://payout-api.cashfree.com/payout/v1/authorize'
        : 'https://payout-gamma.cashfree.com/payout/v1/authorize';

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'x-client-id': this.config.appId!,
        'x-client-secret': this.config.secretKey!,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Cashfree Payouts authentication failed [${res.status}]: ${errBody}`);
    }

    const data: any = await res.json();
    if (data.status !== 'SUCCESS' || !data.data?.token) {
      throw new Error(
        `Cashfree Payouts authorize returned unexpected response: ${JSON.stringify(data)}`,
      );
    }

    const token = data.data.token as string;
    // expiry is typically "YYYY-MM-DD HH:mm:ss" in IST
    // Parse conservatively; default 29 minutes if unparseable
    let expiresAt = nowMs + 29 * 60 * 1000;
    if (data.data.expiry) {
      const parsed = new Date(data.data.expiry).getTime();
      if (!isNaN(parsed)) {
        expiresAt = parsed;
      }
    }

    this.payoutsTokenCache = { token, expiresAt };
    this.logger.log('Cashfree Payouts Bearer token refreshed.');
    return token;
  }

  /**
   * Execute Payout/Disbursement Transfer to Host or Co-Host.
   *
   * Official endpoint: POST /payout/v1/requestTransfer
   * Authentication: Bearer token (from authenticatePayouts)
   * Required body fields: transferId, amount, beneId, transferMode, remarks
   * Reference: https://docs.cashfree.com/reference/payout-request-transfer
   *
   * IMPORTANT: The provider accepting the request does NOT mean funds are delivered.
   * status=PENDING is returned for async transfers. Always wait for webhook or
   * call getTransferStatus() to confirm terminal state.
   */
  async executeTransfer(
    input: CashfreeTransferInput,
  ): Promise<ProviderTransferResult> {
    // DISABLED guard: fail loudly before any provider call
    this.guardPayoutsEnabled();

    if (this.config.environment === 'MOCK') {
      // MOCK/SIMULATION mode: returns a fake success, tagged as simulated
      const mockRef = `cf_tx_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      this.logger.log(`[SIMULATION] Payout transfer simulated: ${input.transferId} → ${mockRef}`);
      return {
        status: 'SUCCESS',
        providerReference: mockRef,
        rawResponse: { mock: true, simulated: true, isSimulated: true, transferId: input.transferId },
        _simulated: true,
      };
    }

    if (!this.config.appId || !this.config.secretKey) {
      throw new ServiceUnavailableException(
        `Cashfree credentials (appId/secretKey) are missing for environment "${this.config.environment}". ` +
        `Refusing to simulate payout transfer. Payouts require verified credentials.`,
      );
    }

    const baseUrl =
      this.config.environment === 'PRODUCTION'
        ? 'https://payout-api.cashfree.com/payout/v1/requestTransfer'
        : 'https://payout-gamma.cashfree.com/payout/v1/requestTransfer';

    try {
      // Obtain fresh Bearer token (cached)
      const bearerToken = await this.authenticatePayouts();

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferId: input.transferId,
          amount: Number(input.amount).toFixed(2),
          beneId: input.beneficiaryId,
          transferMode: input.transferMode || 'IMPS',
          remarks: input.narration || 'FairBnB Host Payout',
        }),
      });

      const data: any = await res.json();

      if (!res.ok) {
        // 401 = token expired; evict cache so next call re-authenticates
        if (res.status === 401) {
          this.payoutsTokenCache = null;
        }
        return {
          status: 'FAILED',
          failureReason: data.message || `Transfer failed [${res.status}]`,
          rawResponse: data,
        };
      }

      // SUCCESS = terminal success, PENDING = async (treat as UNKNOWN until webhook confirms)
      if (data.status === 'SUCCESS') {
        return {
          status: 'SUCCESS',
          providerReference: data.data?.referenceId || data.subCode,
          rawResponse: data,
        };
      } else if (data.status === 'PENDING') {
        return {
          status: 'UNKNOWN',
          providerReference: data.data?.referenceId,
          rawResponse: data,
        };
      } else {
        return {
          status: 'FAILED',
          failureReason: data.message || 'Transfer rejected by provider',
          rawResponse: data,
        };
      }
    } catch (err: any) {
      // Network error or timeout must NEVER be treated as confirmed failure
      this.logger.warn(`Payout transfer dispatch UNKNOWN (network/timeout): ${err.message}`);
      return {
        status: 'UNKNOWN',
        failureReason: `TIMEOUT_OR_NETWORK_ERROR: ${err.message}`,
      };
    }
  }

  /**
   * Check status of a transfer from Cashfree Payouts API for reconciliation.
   * Note: Permitted even when new payouts are disabled (payoutsEnabled=false),
   * because reconciliation of uncertain transfers is read-only.
   *
   * Official endpoint: GET /payout/v1/getTransferStatus?transferId={id}
   * Authentication: Bearer token (from authenticatePayouts)
   * Reference: https://docs.cashfree.com/reference/payout-get-transfer-status
   */
  async getTransferStatus(
    transferId: string,
  ): Promise<ProviderTransferResult> {
    if (this.config.environment === 'DISABLED') {
      throw new ServiceUnavailableException(
        'Cashfree integration is administratively DISABLED.',
      );
    }

    if (this.config.environment === 'MOCK') {
      return {
        status: 'SUCCESS',
        providerReference: `cf_tx_mock_reconciled_${Date.now()}`,
        rawResponse: { mock: true, simulated: true, isSimulated: true, transferId },
        _simulated: true,
      };
    }

    if (!this.config.appId || !this.config.secretKey) {
      throw new ServiceUnavailableException(
        `Cashfree credentials (appId/secretKey) are missing for environment "${this.config.environment}". ` +
        `Refusing to simulate transfer status. Status check requires verified credentials.`,
      );
    }

    const baseUrl =
      this.config.environment === 'PRODUCTION'
        ? `https://payout-api.cashfree.com/payout/v1/getTransferStatus?transferId=${encodeURIComponent(transferId)}`
        : `https://payout-gamma.cashfree.com/payout/v1/getTransferStatus?transferId=${encodeURIComponent(transferId)}`;

    try {
      const bearerToken = await this.authenticatePayouts();

      const res = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      const data: any = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          this.payoutsTokenCache = null;
        }
        return {
          status: 'UNKNOWN',
          failureReason: data.message || `Status check failed [${res.status}]`,
          rawResponse: data,
        };
      }

      if (data.status === 'SUCCESS' && data.data?.transfer?.status === 'SUCCESS') {
        const ack = data.data?.transfer?.acknowledged;
        // Cashfree Payouts confirmation semantics:
        // ack = 0 means remitter debit succeeded, but beneficiary bank credit is NOT yet confirmed!
        // It must NOT be treated as final SUCCESS when acknowledged === 0.
        if (ack !== undefined && (ack === 0 || ack === '0')) {
          return {
            status: 'UNKNOWN',
            providerReference:
              data.data?.transfer?.referenceId || data.data?.transfer?.utr,
            failureReason: 'DEBIT_SUCCESS_AWAITING_BENEFICIARY_ACKNOWLEDGEMENT',
            rawResponse: data,
          };
        }

        return {
          status: 'SUCCESS',
          providerReference:
            data.data?.transfer?.referenceId || data.data?.transfer?.utr,
          rawResponse: data,
        };
      } else if (
        data.data?.transfer?.status === 'FAILED' ||
        data.data?.transfer?.status === 'REVERSED' ||
        data.data?.transfer?.status === 'REJECTED'
      ) {
        return {
          status: 'FAILED',
          failureReason: data.data?.transfer?.reason || 'Transfer failed at provider',
          rawResponse: data,
        };
      } else {
        return {
          status: 'UNKNOWN',
          providerReference: data.data?.transfer?.referenceId,
          rawResponse: data,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Transfer status check UNKNOWN (network/timeout): ${err.message}`);
      return {
        status: 'UNKNOWN',
        failureReason: `TIMEOUT_OR_NETWORK_ERROR: ${err.message}`,
      };
    }
  }
}