import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService, SignedUploadParams } from './cloudinary.service.js';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto.js';
import { CreateReelEventDto, ReelEventType } from './dto/create-reel-event.dto.js';


export interface UploadSignatureResponse extends SignedUploadParams {
  reelId: string;
}

export interface WebhookProcessResponse {
  success: boolean;
  message: string;
  reelId?: string;
  status?: string;
}

/**
 * V1 Feed Ranking Scoring Function: Freshness + Engagement + Completion Rate.
 * Deterministic, non-AI global scoring model.
 */
export function calculateReelV1Score(reel: {
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  likeCount?: number | null;
  commentCount?: number | null;
  viewCount?: number | null;
  analytics?: {
    views?: number | null;
    completions100?: number | null;
    listingClicks?: number | null;
  } | null;
  now?: Date;
}): number {
  const currentTime = reel.now ? new Date(reel.now) : new Date();

  // 1. Freshness Score (0 - 40 points): exponential decay with 48h half-life
  const pubDate = reel.publishedAt ? new Date(reel.publishedAt) : (reel.createdAt ? new Date(reel.createdAt) : currentTime);
  const ageHours = Math.max(0, (currentTime.getTime() - pubDate.getTime()) / (1000 * 60 * 60));
  const freshnessScore = 40 * Math.exp(-ageHours / 48);

  // 2. Engagement Score (0 - 35 points): log-normalized likes, comments, and listing clicks
  const likes = Math.max(0, reel.likeCount || 0);
  const comments = Math.max(0, reel.commentCount || 0);
  const clicks = Math.max(0, reel.analytics?.listingClicks || 0);

  const likeComponent = 15 * Math.min(1, Math.log1p(likes) / Math.log1p(100000));
  const commentComponent = 12 * Math.min(1, Math.log1p(comments) / Math.log1p(10000));
  const clickComponent = 8 * Math.min(1, Math.log1p(clicks) / Math.log1p(5000));
  const engagementScore = Math.min(35, likeComponent + commentComponent + clickComponent);

  // 3. Completion Rate Score (0 - 25 points): completion ratio with cold-start baseline
  const views = Math.max(0, reel.analytics?.views || reel.viewCount || 0);
  const completions = Math.max(0, reel.analytics?.completions100 || 0);

  let completionRate = 0.5; // Cold-start neutral baseline (12.5 pts) for < 3 views
  if (views >= 3) {
    completionRate = Math.min(1, completions / views);
  }
  const completionScore = 25 * completionRate;

  const total = freshnessScore + engagementScore + completionScore;
  if (!isFinite(total) || isNaN(total)) {
    return 0;
  }
  return Number(total.toFixed(4));
}

@Injectable()
export class ReelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Helper method to recompute and persist a Reel's rankingScore.
   */
  async recomputeReelRankingScore(reelId: string): Promise<number> {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
      select: {
        id: true,
        publishedAt: true,
        createdAt: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        analytics: {
          select: {
            views: true,
            completions100: true,
            listingClicks: true,
          },
        },
      },
    });

    if (!reel) return 0;

    const rankingScore = calculateReelV1Score(reel);
    await this.prisma.reel.update({
      where: { id: reelId },
      data: { rankingScore },
    });

    return rankingScore;
  }

  /**
   * Initializes a Reel upload session and returns signed upload parameters.
   * Enforces backend role-based access control:
   * - USER / GUEST: Rejected with 403 Forbidden.
   * - HOST: Must own the target property (if propertyId provided).
   * - CO-HOST: Must have an ACTIVE CoHostRelationship and EDIT_LISTING permission.
   */
  async createUploadSignature(
    currentUser: { id: string; role: string },
    dto: CreateUploadSignatureDto,
  ): Promise<UploadSignatureResponse> {
    const userRoleStr = String(currentUser.role).toUpperCase();

    // 1. Role Authorization Check: Normal USER (Guest) is strictly forbidden
    if (userRoleStr === 'USER') {
      throw new ForbiddenException(
        'Guests are not allowed to create or upload Reels.',
      );
    }

    // 2. Property Context Authorization (if propertyId is supplied)
    if (dto.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
        select: { id: true, hostId: true, ownerId: true },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      const isOwner =
        property.hostId === currentUser.id ||
        (property.ownerId && property.ownerId === currentUser.id);

      if (!isOwner) {
        // Check if user is an active Co-Host with required permission
        const coHostRel = await this.prisma.coHostRelationship.findUnique({
          where: {
            propertyId_coHostUserId: {
              propertyId: dto.propertyId,
              coHostUserId: currentUser.id,
            },
          },
          include: {
            permissions: true,
          },
        });

        if (!coHostRel || coHostRel.status !== 'ACTIVE') {
          throw new ForbiddenException(
            'Access denied: You are not an active co-host for this property.',
          );
        }

        const hasRequiredPermission = coHostRel.permissions.some(
          (p) => p.permission === 'EDIT_LISTING',
        );

        if (!hasRequiredPermission) {
          throw new ForbiddenException(
            'Access denied: Co-Host lacks EDIT_LISTING permission required for creating property Reels.',
          );
        }
      }
    } else if (userRoleStr === 'ADMIN') {
      // ADMIN without property context is rejected from creating personal creator Reels
      throw new ForbiddenException(
        'Admin users must have creator rights or property ownership to upload Reels.',
      );
    }

    // 3. File constraints validation
    if (dto.fileSize && dto.fileSize > 500 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds maximum limit of 500MB');
    }

    // 4. Initialize Reel database record (Initial State: DRAFT — NEVER PUBLISHED)
    const reel = await this.prisma.reel.create({
      data: {
        creatorId: currentUser.id, // Strictly from authenticated JWT user ID
        caption: dto.caption || null,
        status: 'DRAFT',
        taggedListings: dto.propertyId
          ? {
              create: {
                propertyId: dto.propertyId,
              },
            }
          : undefined,
      },
    });

    // 5. Generate secure server-side Cloudinary upload params
    const uploadParams = this.cloudinaryService.generateSignedUploadParams(
      reel.id,
    );

    return {
      reelId: reel.id,
      ...uploadParams,
    };
  }

  /**
   * Processes verified Cloudinary webhooks and updates Reel status lifecycle.
   * Enforces state machine transitions: DRAFT -> PROCESSING -> PUBLISHED, or DRAFT/PROCESSING -> FAILED.
   * Enforces webhook authenticity, resource_type validation, asset verification, and idempotent delivery.
   */
  async processCloudinaryWebhook(
    payload: any,
    rawBodyString: string,
    signatureHeader?: string,
    timestampHeader?: string | number,
  ): Promise<WebhookProcessResponse> {
    const timestamp =
      timestampHeader || payload.timestamp || payload.notification_timestamp;
    const signature = signatureHeader || payload.signature;

    // 1. Verify Webhook Signature Authenticity
    const isSignatureValid = this.cloudinaryService.verifyWebhookSignature(
      rawBodyString,
      timestamp,
      signature,
    );

    if (!isSignatureValid) {
      throw new UnauthorizedException(
        'Invalid or missing Cloudinary webhook signature',
      );
    }

    // 2. Validate Resource Type (Must be video)
    if (payload.resource_type && payload.resource_type !== 'video') {
      return {
        success: false,
        message: `Invalid resource_type: expected 'video', received '${payload.resource_type}'`,
      };
    }

    const rawPublicId = payload.public_id || payload.publicId;
    if (!rawPublicId) {
      return { success: false, message: 'Webhook payload missing public_id' };
    }

    // Extract Reel ID from public_id (handles folder paths like 'fairbnb/reels/reel_123')
    const extractedReelId = String(rawPublicId).split('/').pop();

    // 3. Locate Reel in DB by ID or Cloudinary Public ID
    const reel = await this.prisma.reel.findFirst({
      where: {
        OR: [
          { id: extractedReelId },
          { id: rawPublicId },
          { cloudinaryPublicId: rawPublicId },
        ],
      },
    });

    if (!reel) {
      return {
        success: false,
        message: `No matching Reel record found for public_id: ${rawPublicId}`,
      };
    }

    // 4. Replay / Idempotency Check: Already Published Reels remain safely PUBLISHED
    if (reel.status === 'PUBLISHED') {
      return {
        success: true,
        message: 'Reel is already published (Idempotent call)',
        reelId: reel.id,
        status: 'PUBLISHED',
      };
    }

    // 5. Reject status mutations on REJECTED, ARCHIVED, or HIDDEN reels
    if (reel.status === 'REJECTED' || reel.status === 'ARCHIVED' || reel.status === 'HIDDEN') {
      return {
        success: false,
        message: `Cannot modify a Reel in ${reel.status} state`,
        reelId: reel.id,
        status: reel.status,
      };
    }

    // 6. Handle Cloudinary Processing Failure Notifications
    if (
      payload.notification_type === 'upload_failed' ||
      payload.notification_type === 'eager_failed' ||
      payload.status === 'failed' ||
      payload.error
    ) {
      await this.prisma.reel.update({
        where: { id: reel.id },
        data: { status: 'FAILED' },
      });

      return {
        success: true,
        message: 'Reel status updated to FAILED due to Cloudinary processing error',
        reelId: reel.id,
        status: 'FAILED',
      };
    }

    // 7. Check if Eager HLS Transcoding is Completed
    const eagerM3u8 = Array.isArray(payload.eager)
      ? payload.eager.find(
          (e: any) =>
            e.format === 'm3u8' ||
            (typeof e.secure_url === 'string' && e.secure_url.includes('.m3u8')) ||
            (typeof e.url === 'string' && e.url.includes('.m3u8')),
        )
      : null;

    const hasVerifiedHls = Boolean(eagerM3u8?.secure_url || eagerM3u8?.url);
    const isEagerNotification =
      payload.notification_type === 'eager' ||
      payload.eager_status === 'complete';

    if (hasVerifiedHls || isEagerNotification) {
      // Eager HLS Processing Completed or Eager event finished -> Transition to PUBLISHED
      const videoUrl =
        payload.secure_url ||
        payload.url ||
        reel.videoUrl ||
        `https://res.cloudinary.com/demo/video/upload/v1/${rawPublicId}.mp4`;

      // Enforce strict eager HLS verification: only set hlsUrl if verified from eager variant.
      // Never store a synthetic 404 .m3u8 URL; fall back to verified direct videoUrl.
      const hlsUrl =
        eagerM3u8?.secure_url ||
        eagerM3u8?.url ||
        reel.hlsUrl ||
        null;

      const posterUrl =
        payload.poster_url ||
        this.cloudinaryService.generatePosterUrl(rawPublicId);

      const updatedReel = await this.prisma.reel.update({
        where: { id: reel.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: reel.publishedAt || new Date(),
          videoUrl,
          hlsUrl,
          posterUrl,
          cloudinaryPublicId: rawPublicId,
          duration: payload.duration ? Number(payload.duration) : reel.duration,
          width: payload.width ? Number(payload.width) : reel.width,
          height: payload.height ? Number(payload.height) : reel.height,
          format: payload.format || reel.format || 'mp4',
        },
      });

      return {
        success: true,
        message: hasVerifiedHls
          ? 'Reel HLS eager processing completed and published successfully'
          : 'Reel processed and published with direct video fallback',
        reelId: updatedReel.id,
        status: 'PUBLISHED',
      };
    }

    // 8. Raw Upload Completed -> Transition DRAFT to PROCESSING phase
    const videoUrl =
      payload.secure_url ||
      payload.url ||
      `https://res.cloudinary.com/demo/video/upload/v1/${rawPublicId}.mp4`;

    const updatedReel = await this.prisma.reel.update({
      where: { id: reel.id },
      data: {
        status: 'PROCESSING',
        videoUrl,
        cloudinaryPublicId: rawPublicId,
        duration: payload.duration ? Number(payload.duration) : reel.duration,
        width: payload.width ? Number(payload.width) : reel.width,
        height: payload.height ? Number(payload.height) : reel.height,
        format: payload.format || reel.format || 'mp4',
      },
    });

    return {
      success: true,
      message: 'Raw video upload received; Reel status updated to PROCESSING phase',
      reelId: updatedReel.id,
      status: 'PROCESSING',
    };
  }

  /**
   * Public Reels Feed API with V1 Ranking.
   * Ranks published Reels by V1 score (Freshness + Engagement + Completion Rate) deterministically.
   * Filters out all DRAFT, PROCESSING, FAILED, REJECTED, and ARCHIVED Reels.
   * Excludes sensitive user data and private credentials.
   */
  async getReelsFeed(
    query: {
      limit?: number;
      cursor?: string;
      creatorId?: string;
    },
    currentUserId?: string,
  ): Promise<{ items: any[]; nextCursor: string | null }> {
    const takeLimit = Math.min(Math.max(Number(query.limit) || 10, 1), 20);

    const reels = await this.prisma.reel.findMany({
      where: {
        status: 'PUBLISHED',
        ...(query.creatorId ? { creatorId: query.creatorId } : {}),
      },
      take: takeLimit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: [
        { rankingScore: 'desc' },
        { publishedAt: 'desc' },
        { id: 'desc' },
      ],
      select: {
        id: true,
        hlsUrl: true,
        posterUrl: true,
        videoUrl: true,
        duration: true,
        width: true,
        height: true,
        caption: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        taggedListings: {
          take: 1,
          select: {
            property: {
              select: {
                id: true,
                title: true,
                city: true,
                basePrice: true,
                images: true,
              },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (reels.length > takeLimit) {
      const nextItem = reels.pop();
      nextCursor = nextItem?.id || null;
    }

    const items = reels.map((reel: any) => {
      const taggedProp = reel.taggedListings?.[0]?.property;
      return {
        id: reel.id,
        hlsUrl: reel.hlsUrl || '',
        posterUrl: reel.posterUrl,
        videoUrl: reel.videoUrl,
        duration: reel.duration,
        width: reel.width,
        height: reel.height,
        caption: reel.caption,
        likeCount: reel.likeCount || 0,
        commentCount: reel.commentCount || 0,
        isLikedByCurrentUser: Array.isArray(reel.likes) && reel.likes.length > 0,
        publishedAt: reel.publishedAt,
        creator: {
          id: reel.creator?.id || '',
          name: reel.creator?.name || 'FairBnB Host',
          avatarUrl: reel.creator?.avatarUrl,
        },
        property: taggedProp
          ? {
              id: taggedProp.id,
              title: taggedProp.title,
              city: taggedProp.city,
              pricePerNight: taggedProp.basePrice,
              thumbnailUrl: Array.isArray(taggedProp.images)
                ? taggedProp.images[0]
                : null,
            }
          : null,
      };
    });

    return { items, nextCursor };
  }

  /**
   * Validates Reel existence and PUBLISHED status for share tracking.
   */
  async trackShare(reelId: string): Promise<{ success: boolean; reelId: string }> {
    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    return { success: true, reelId };
  }

  /**
   * Likes a published Reel for the authenticated user.
   * Atomic operation preventing race conditions and duplicate likes.
   */
  async likeReel(
    userId: string,
    reelId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    const txRunner = this.prisma.$transaction
      ? (fn: any) => this.prisma.$transaction(fn)
      : async (fn: any) => fn(this.prisma);

    const { likeCount } = await txRunner(async (tx: any) => {
      // Row-level lock on the target Reel to serialize concurrent counter mutations
      // and guarantee atomic parity between ReelLike rows and Reel.likeCount under high concurrency.
      if (typeof tx.$executeRaw === 'function') {
        await tx.$executeRaw`SELECT 1 FROM "Reel" WHERE "id" = ${reelId} FOR UPDATE`;
      }

      if (tx.reelLike.upsert) {
        await tx.reelLike.upsert({
          where: {
            reelId_userId: { reelId, userId },
          },
          create: { reelId, userId },
          update: {},
        });
      } else {
        try {
          await tx.reelLike.create({
            data: {
              reelId,
              userId,
            },
          });
        } catch (err: any) {
          // P2002: Unique constraint failed (Already liked); idempotent
          if (err?.code !== 'P2002') throw err;
        }
      }

      const count = await tx.reelLike.count({
        where: { reelId },
      });

      await tx.reel.update({
        where: { id: reelId },
        data: { likeCount: count },
      });

      return { likeCount: count };
    });

    await this.recomputeReelRankingScore(reelId).catch(() => {});

    return { liked: true, likeCount };
  }

  /**
   * Unlikes a published Reel for the authenticated user.
   */
  async unlikeReel(
    userId: string,
    reelId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    const txRunner = this.prisma.$transaction
      ? (fn: any) => this.prisma.$transaction(fn)
      : async (fn: any) => fn(this.prisma);

    const { likeCount } = await txRunner(async (tx: any) => {
      // Row-level lock on the target Reel to serialize concurrent counter mutations
      if (typeof tx.$executeRaw === 'function') {
        await tx.$executeRaw`SELECT 1 FROM "Reel" WHERE "id" = ${reelId} FOR UPDATE`;
      }

      await tx.reelLike.deleteMany({
        where: { reelId, userId },
      });

      const count = await tx.reelLike.count({
        where: { reelId },
      });

      await tx.reel.update({
        where: { id: reelId },
        data: { likeCount: count },
      });

      return { likeCount: count };
    });

    await this.recomputeReelRankingScore(reelId).catch(() => {});

    return { liked: false, likeCount };
  }

  /**
   * Adds a comment to a published Reel.
   */
  async addComment(userId: string, reelId: string, content: string) {
    const trimmed = content ? content.trim() : '';
    if (!trimmed) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    const comment = await this.prisma.reelComment.create({
      data: {
        reelId,
        userId,
        content: trimmed,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const commentCount = await this.prisma.reelComment.count({
      where: { reelId },
    });

    await this.prisma.reel.update({
      where: { id: reelId },
      data: { commentCount },
    });
    await this.recomputeReelRankingScore(reelId).catch(() => {});

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.user.id,
        name: comment.user.name,
        avatarUrl: comment.user.avatarUrl,
      },
    };
  }

  /**
   * Reads comments for a published Reel with cursor pagination.
   */
  async getComments(reelId: string, query?: { limit?: number; cursor?: string }) {
    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    const takeLimit = Math.min(Math.max(Number(query?.limit) || 20, 1), 50);

    const comments = await this.prisma.reelComment.findMany({
      where: { reelId },
      take: takeLimit + 1,
      cursor: query?.cursor ? { id: query.cursor } : undefined,
      skip: query?.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (comments.length > takeLimit) {
      const nextItem = comments.pop();
      nextCursor = nextItem?.id || null;
    }

    const items = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: {
        id: c.user.id,
        name: c.user.name,
        avatarUrl: c.user.avatarUrl,
      },
    }));

    return { items, nextCursor };
  }

  /**
   * Deletes a comment owned by the authenticated user.
   */
  async deleteComment(userId: string, reelId: string, commentId: string) {
    const comment = await this.prisma.reelComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.reelId !== reelId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    await this.prisma.reelComment.delete({
      where: { id: commentId },
    });

    const commentCount = await this.prisma.reelComment.count({
      where: { reelId },
    });

    await this.prisma.reel.update({
      where: { id: reelId },
      data: { commentCount },
    });
    await this.recomputeReelRankingScore(reelId).catch(() => {});

    return { success: true, message: 'Comment deleted successfully' };

    return { success: true, message: 'Comment deleted successfully' };
  }

  /**
   * Submits a report for a published Reel.
   */
  async reportReel(userId: string, reelId: string, reason: string) {
    const trimmed = reason ? reason.trim() : '';
    if (!trimmed) {
      throw new BadRequestException('Report reason cannot be empty');
    }

    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    const existingReport = this.prisma.reelReport.findFirst
      ? await this.prisma.reelReport.findFirst({
          where: {
            reelId,
            commentId: null,
            reporterId: userId,
            status: 'PENDING',
          },
        })
      : null;

    if (existingReport) {
      return {
        success: true,
        message: 'Reel report already submitted and pending review',
        reportId: existingReport.id,
        status: existingReport.status,
      };
    }

    const report = await this.prisma.reelReport.create({
      data: {
        reelId,
        reporterId: userId,
        reason: trimmed,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message: 'Reel report submitted successfully',
      reportId: report.id,
      status: report.status,
    };
  }

  /**
   * Submits a report for a Reel comment.
   */
  async reportComment(userId: string, reelId: string, commentId: string, reason: string) {
    const trimmed = reason ? reason.trim() : '';
    if (!trimmed) {
      throw new BadRequestException('Report reason cannot be empty');
    }

    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    const comment = await this.prisma.reelComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.reelId !== reelId) {
      throw new NotFoundException('Comment not found for this Reel');
    }

    const existingReport = this.prisma.reelReport.findFirst
      ? await this.prisma.reelReport.findFirst({
          where: {
            reelId,
            commentId,
            reporterId: userId,
            status: 'PENDING',
          },
        })
      : null;

    if (existingReport) {
      return {
        success: true,
        message: 'Comment report already submitted and pending review',
        reportId: existingReport.id,
        status: existingReport.status,
      };
    }

    const report = await this.prisma.reelReport.create({
      data: {
        reelId,
        commentId,
        reporterId: userId,
        reason: trimmed,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message: 'Comment report submitted successfully',
      reportId: report.id,
      status: report.status,
    };
  }

  /**
   * Admin-only retrieval of Reel and Comment report queue.
   */
  async getAdminReports(query: { status?: string; limit?: number; cursor?: string }) {
    const takeLimit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const statusFilter = query.status && query.status !== 'ALL' ? (query.status as any) : undefined;

    const reports = await this.prisma.reelReport.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      take: takeLimit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        reel: {
          select: { id: true, caption: true, status: true, creatorId: true },
        },
        comment: {
          select: { id: true, content: true, userId: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (reports.length > takeLimit) {
      const nextItem = reports.pop();
      nextCursor = nextItem?.id || null;
    }

    const items = reports.map((r) => ({
      id: r.id,
      type: r.commentId ? 'COMMENT' : 'REEL',
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      reporter: {
        id: r.reporter.id,
        name: r.reporter.name,
        email: r.reporter.email,
      },
      reel: r.reel
        ? {
            id: r.reel.id,
            caption: r.reel.caption,
            status: r.reel.status,
            creatorId: r.reel.creatorId,
          }
        : null,
      comment: r.comment
        ? {
            id: r.comment.id,
            content: r.comment.content,
            userId: r.comment.userId,
          }
        : null,
    }));

    return { items, nextCursor };
  }

  /**
   * Admin moderation action on a report (DISMISS, HIDE, REJECT, ARCHIVE).
   */
  async handleAdminReportAction(reportId: string, action: string) {
    const report = await this.prisma.reelReport.findUnique({
      where: { id: reportId },
      include: { reel: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const upperAction = String(action).toUpperCase();
    const now = new Date();

    if (upperAction === 'DISMISS') {
      const updatedReport = await this.prisma.reelReport.update({
        where: { id: reportId },
        data: { status: 'DISMISSED', resolvedAt: now },
      });
      return {
        success: true,
        message: 'Report dismissed',
        reportId: updatedReport.id,
        status: updatedReport.status,
      };
    }

    let targetReelStatus: any = 'HIDDEN';
    if (upperAction === 'REJECT') targetReelStatus = 'REJECTED';
    if (upperAction === 'ARCHIVE') targetReelStatus = 'ARCHIVED';

    if (report.reelId) {
      await this.prisma.reel.update({
        where: { id: report.reelId },
        data: { status: targetReelStatus },
      });
    }

    if (report.commentId) {
      await this.prisma.reelComment.deleteMany({
        where: { id: report.commentId },
      });
    }

    const updatedReport = await this.prisma.reelReport.update({
      where: { id: reportId },
      data: { status: 'RESOLVED', resolvedAt: now },
    });

    return {
      success: true,
      message: `Report resolved; target Reel status updated to ${targetReelStatus}`,
      reportId: updatedReport.id,
      status: updatedReport.status,
      reelStatus: targetReelStatus,
    };
  }

  /**
   * Admin direct update of Reel moderation status.
   */
  async updateReelModerationStatus(reelId: string, status: string) {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const updatedReel = await this.prisma.reel.update({
      where: { id: reelId },
      data: { status: status as any },
    });

    return {
      success: true,
      message: `Reel status updated to ${updatedReel.status}`,
      reelId: updatedReel.id,
      status: updatedReel.status,
    };
  }

  private eventBuffer: Array<{
    reelId: string;
    dto: CreateReelEventDto;
    userId?: string;
    timestamp: Date;
  }> = [];

  /**
   * Non-blocking ingestion of Reel analytics events.
   * Validates Reel existence and PUBLISHED status, bounds input parameters,
   * buffers the event in memory, and immediately returns 200 OK.
   */
  async recordEvent(
    reelId: string,
    dto: CreateReelEventDto,
    userId?: string,
  ): Promise<{ success: boolean; queued: boolean }> {
    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId, status: 'PUBLISHED' },
    });

    if (!reel) {
      throw new NotFoundException('Published Reel not found');
    }

    if (dto.eventType === ReelEventType.LISTING_CLICK) {
      if (dto.propertyId) {
        const tagged = await this.prisma.reelListing.findUnique({
          where: { reelId_propertyId: { reelId, propertyId: dto.propertyId } },
        });
        if (!tagged) {
          throw new BadRequestException('Reel is not tagged with this property');
        }
      }
    }

    // Sanitize and bound parameters
    const sanitizedDto: CreateReelEventDto = {
      eventType: dto.eventType,
      sessionId: dto.sessionId,
      propertyId: dto.propertyId,
      positionSeconds: dto.positionSeconds ? Math.max(0, Number(dto.positionSeconds)) : 0,
      durationSeconds: dto.durationSeconds ? Math.max(0, Number(dto.durationSeconds)) : (reel.duration || 0),
      progressPercent: dto.progressPercent ? Math.min(100, Math.max(0, Number(dto.progressPercent))) : 0,
    };

    // Buffer event in memory (zero DB latency for playback heartbeats)
    this.eventBuffer.push({
      reelId,
      dto: sanitizedDto,
      userId,
      timestamp: new Date(),
    });

    // Flush asynchronously if buffer size reaches threshold
    if (this.eventBuffer.length >= 20) {
      void this.flushEventBuffer();
    }

    return { success: true, queued: true };
  }

  /**
   * Micro-batch worker flushing buffered analytics events to PostgreSQL.
   */
  async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    // Drain buffer atomically
    const eventsToProcess = [...this.eventBuffer];
    this.eventBuffer = [];

    // Group events by reelId and sessionId
    const sessionMap = new Map<
      string,
      {
        reelId: string;
        sessionId: string;
        userId?: string;
        events: typeof eventsToProcess;
      }
    >();

    for (const event of eventsToProcess) {
      const key = `${event.reelId}:${event.dto.sessionId}`;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          reelId: event.reelId,
          sessionId: event.dto.sessionId,
          userId: event.userId,
          events: [],
        });
      }
      const item = sessionMap.get(key)!;
      item.events.push(event);
      if (event.userId && !item.userId) {
        item.userId = event.userId;
      }
    }

    // Process each session
    for (const [, sessionData] of sessionMap) {
      const { reelId, sessionId, userId, events } = sessionData;

      const maxPosition = Math.max(...events.map((e) => e.dto.positionSeconds || 0), 0);
      const maxProgress = Math.max(...events.map((e) => e.dto.progressPercent || 0), 0);
      const listingClicksCount = events.filter((e) => e.dto.eventType === ReelEventType.LISTING_CLICK).length;

      // Determine milestone values (25, 50, 75, 100)
      let milestone = 0;
      if (maxProgress >= 100 || events.some((e) => e.dto.eventType === ReelEventType.PLAY_COMPLETED)) {
        milestone = 100;
      } else if (maxProgress >= 75) {
        milestone = 75;
      } else if (maxProgress >= 50) {
        milestone = 50;
      } else if (maxProgress >= 25) {
        milestone = 25;
      }

      try {
        // Upsert or update ReelViewSession
        const existingSession = await this.prisma.reelViewSession.findUnique({
          where: { reelId_sessionId: { reelId, sessionId } },
        });

        let isNewSession = false;
        let prevDuration = 0;
        let prevMilestone = 0;

        if (!existingSession) {
          isNewSession = true;
          await this.prisma.reelViewSession.create({
            data: {
              reelId,
              sessionId,
              userId: userId || null,
              watchDuration: maxPosition,
              maxMilestone: milestone,
            },
          });
        } else {
          prevDuration = existingSession.watchDuration;
          prevMilestone = existingSession.maxMilestone;
          const nextDuration = Math.max(prevDuration, maxPosition);
          const nextMilestone = Math.max(prevMilestone, milestone);

          await this.prisma.reelViewSession.update({
            where: { id: existingSession.id },
            data: {
              watchDuration: nextDuration,
              maxMilestone: nextMilestone,
              ...(userId && !existingSession.userId ? { userId } : {}),
            },
          });
        }

        // Upsert ReelAnalytics
        await this.prisma.reelAnalytics.upsert({
          where: { reelId },
          create: {
            reelId,
            views: isNewSession ? 1 : 0,
            uniqueViewers: 1,
            totalWatchDuration: isNewSession ? maxPosition : Math.max(0, maxPosition - prevDuration),
            completions25: milestone >= 25 ? 1 : 0,
            completions50: milestone >= 50 ? 1 : 0,
            completions75: milestone >= 75 ? 1 : 0,
            completions100: milestone >= 100 ? 1 : 0,
            listingClicks: listingClicksCount,
          },
          update: {
            views: isNewSession ? { increment: 1 } : undefined,
            totalWatchDuration: { increment: Math.max(0, maxPosition - prevDuration) },
            completions25: milestone >= 25 && prevMilestone < 25 ? { increment: 1 } : undefined,
            completions50: milestone >= 50 && prevMilestone < 50 ? { increment: 1 } : undefined,
            completions75: milestone >= 75 && prevMilestone < 75 ? { increment: 1 } : undefined,
            completions100: milestone >= 100 && prevMilestone < 100 ? { increment: 1 } : undefined,
            listingClicks: listingClicksCount > 0 ? { increment: listingClicksCount } : undefined,
          },
        });

        // Sync viewCount to Reel model (ReelAnalytics.views is the source of truth)
        if (isNewSession) {
          await this.prisma.reel.update({
            where: { id: reelId },
            data: { viewCount: { increment: 1 } },
          });
        }
      } catch (err) {
        // Non-fatal background batch flush error handling
      }
    }

    // Re-reconcile exact uniqueViewers count per reelId (Authenticated users deduplicated by userId + anonymous sessions)
    const reelIdsToReconcile = Array.from(new Set(eventsToProcess.map((e) => e.reelId)));
    for (const rId of reelIdsToReconcile) {
      try {
        const authUsersGroup = await this.prisma.reelViewSession.groupBy({
          by: ['userId'],
          where: { reelId: rId, userId: { not: null } },
        });
        const anonSessionsCount = await this.prisma.reelViewSession.count({
          where: { reelId: rId, userId: null },
        });
        const calculatedUnique = authUsersGroup.length + anonSessionsCount;

        await this.prisma.reelAnalytics.update({
          where: { reelId: rId },
          data: { uniqueViewers: calculatedUnique },
        });
        await this.recomputeReelRankingScore(rId).catch(() => {});
      } catch {
        // Non-fatal reconciliation error
      }
    }
  }

  /**
   * Retrieves aggregated Reel metrics for the Reel creator/owner.
   */
  async getReelAnalytics(reelId: string, userId: string) {
    const reel = await this.prisma.reel.findFirst({
      where: { id: reelId },
      select: {
        id: true,
        creatorId: true,
        likeCount: true,
        commentCount: true,
        duration: true,
      },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    if (reel.creatorId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view analytics for this Reel',
      );
    }

    // Explicitly flush pending in-memory event buffer before returning analytics
    await this.flushEventBuffer();

    const analytics = await this.prisma.reelAnalytics.findUnique({
      where: { reelId },
    });

    // Authenticated users deduplicated by userId + anonymous sessions
    const authUsersGroup = await this.prisma.reelViewSession.groupBy({
      by: ['userId'],
      where: { reelId, userId: { not: null } },
    });
    const anonSessionsCount = await this.prisma.reelViewSession.count({
      where: { reelId, userId: null },
    });
    const calculatedUniqueViewers = authUsersGroup.length + anonSessionsCount;

    const views = analytics?.views || 0;
    const totalDuration = analytics?.totalWatchDuration || 0;
    const avgWatchTime = views > 0 ? Number((totalDuration / views).toFixed(1)) : 0;
    const c100 = analytics?.completions100 || 0;
    const completionRate = views > 0 ? Number(((c100 / views) * 100).toFixed(1)) : 0;

    return {
      reelId,
      views,
      uniqueViewers: views > 0 ? Math.max(1, calculatedUniqueViewers) : 0,
      totalWatchDuration: Number(totalDuration.toFixed(1)),
      averageWatchDuration: avgWatchTime,
      listingClicks: analytics?.listingClicks || 0,
      completions: {
        c25: analytics?.completions25 || 0,
        c50: analytics?.completions50 || 0,
        c75: analytics?.completions75 || 0,
        c100,
        completionRate,
      },
      engagement: {
        likeCount: reel.likeCount || 0,
        commentCount: reel.commentCount || 0,
      },
    };
  }

}

