import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Headers,
  Query,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReelsService, UploadSignatureResponse, WebhookProcessResponse } from './reels.service.js';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto.js';
import { CreateReelCommentDto } from './dto/create-reel-comment.dto.js';
import { CreateReelReportDto } from './dto/create-reel-report.dto.js';
import { CreateCommentReportDto } from './dto/create-comment-report.dto.js';
import { AdminReportActionDto, AdminUpdateReelStatusDto } from './dto/admin-reel-moderation.dto.js';
import { CreateReelEventDto } from './dto/create-reel-event.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ReelRateLimitGuard } from './guards/reel-rate-limit.guard.js';
import { ReelsFeatureGuard } from './guards/reels-feature.guard.js';
import { ReelThrottle } from './decorators/reel-throttle.decorator.js';

@Controller('reels')
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  /**
   * Public Reels Feed API endpoint.
   * Returns published Reels only ordered deterministically with cursor pagination.
   */
  @Get()
  @UseGuards(ReelsFeatureGuard)
  @HttpCode(HttpStatus.OK)
  async getReelsFeed(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('creatorId') creatorId?: string,
  ) {
    return this.reelsService.getReelsFeed({
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
      creatorId,
    });
  }

  /**
   * GET /reels/creator/:creatorId
   * Returns published Reels uploaded by a specific creator.
   */
  @Get('creator/:creatorId')
  @UseGuards(ReelsFeatureGuard)
  @HttpCode(HttpStatus.OK)
  async getCreatorReels(
    @Param('creatorId') creatorId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.reelsService.getReelsFeed({
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
      creatorId,
    });
  }

  /**
   * Likes a published Reel. Requires authentication.
   */
  @Post(':reelId/like')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard, ReelRateLimitGuard)
  @ReelThrottle(30, 60, 'like-reel')
  @HttpCode(HttpStatus.OK)
  async likeReel(
    @CurrentUser() user: any,
    @Param('reelId') reelId: string,
  ) {
    return this.reelsService.likeReel(user.id, reelId);
  }

  /**
   * Unlikes a published Reel. Requires authentication.
   */
  @Delete(':reelId/like')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard, ReelRateLimitGuard)
  @ReelThrottle(30, 60, 'like-reel')
  @HttpCode(HttpStatus.OK)
  async unlikeReel(
    @CurrentUser() user: any,
    @Param('reelId') reelId: string,
  ) {
    return this.reelsService.unlikeReel(user.id, reelId);
  }

  /**
   * Adds a comment to a published Reel. Requires authentication.
   * Rate limited: 3 comments per 15 minutes (900s) to prevent server overload.
   */
  @Post(':reelId/comments')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard, ReelRateLimitGuard)
  @ReelThrottle(3, 900, 'add-comment')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @CurrentUser() user: any,
    @Param('reelId') reelId: string,
    @Body() dto: CreateReelCommentDto,
  ) {
    return this.reelsService.addComment(user.id, reelId, dto.content);
  }

  /**
   * Publicly reads comments for a published Reel.
   */
  @Get(':reelId/comments')
  @UseGuards(ReelsFeatureGuard)
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Param('reelId') reelId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.reelsService.getComments(reelId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  /**
   * Deletes a comment owned by the authenticated user.
   */
  @Delete(':reelId/comments/:commentId')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @CurrentUser() user: any,
    @Param('reelId') reelId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.reelsService.deleteComment(user.id, reelId, commentId);
  }

  /**
   * Reports a published Reel. Requires authentication.
   */
  @Post(':reelId/report')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard, ReelRateLimitGuard)
  @ReelThrottle(5, 60, 'report-reel')
  @HttpCode(HttpStatus.CREATED)
  async reportReel(
    @CurrentUser() user: any,
    @Param('reelId') reelId: string,
    @Body() dto: CreateReelReportDto,
  ) {
    return this.reelsService.reportReel(user.id, reelId, dto.reason);
  }

  /**
   * Reports a Reel comment. Requires authentication.
   */
  @Post(':reelId/comments/:commentId/report')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard, ReelRateLimitGuard)
  @ReelThrottle(5, 60, 'report-comment')
  @HttpCode(HttpStatus.CREATED)
  async reportComment(
    @CurrentUser() user: any,
    @Param('reelId') reelId: string,
    @Param('commentId') commentId: string,
    @Body() dto: CreateCommentReportDto,
  ) {
    return this.reelsService.reportComment(user.id, reelId, commentId, dto.reason);
  }

  /**
   * Admin Endpoint: Retrieves moderation report queue for Reels & Comments.
   * Requires ADMIN role. (Exempt from global ReelsFeatureGuard)
   */
  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAdminReports(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.reelsService.getAdminReports({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  /**
   * Admin Endpoint: Performs moderation action on a report (DISMISS, HIDE, REJECT, ARCHIVE).
   * Requires ADMIN role. (Exempt from global ReelsFeatureGuard)
   */
  @Patch('admin/reports/:reportId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async handleAdminReportAction(
    @Param('reportId') reportId: string,
    @Body() dto: AdminReportActionDto,
  ) {
    return this.reelsService.handleAdminReportAction(reportId, dto.action);
  }

  /**
   * Admin Endpoint: Directly updates a Reel's moderation status (PUBLISHED, HIDDEN, REJECTED, ARCHIVED).
   * Requires ADMIN role. (Exempt from global ReelsFeatureGuard)
   */
  @Patch('admin/:reelId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateReelModerationStatus(
    @Param('reelId') reelId: string,
    @Body() dto: AdminUpdateReelStatusDto,
  ) {
    return this.reelsService.updateReelModerationStatus(reelId, dto.status);
  }

  /**
   * Public endpoint to validate published Reel share attempts.
   */
  @Post(':reelId/share')
  @UseGuards(ReelsFeatureGuard)
  @HttpCode(HttpStatus.OK)
  async shareReel(@Param('reelId') reelId: string) {
    return this.reelsService.trackShare(reelId);
  }

  /**
   * Public non-blocking endpoint for Reel analytics event ingestion.
   */
  @Post(':reelId/events')
  @UseGuards(ReelsFeatureGuard, ReelRateLimitGuard)
  @ReelThrottle(60, 60, 'record-event')
  @HttpCode(HttpStatus.OK)
  async recordEvent(
    @Param('reelId') reelId: string,
    @Body() dto: CreateReelEventDto,
    @Req() req: any,
  ) {
    const userId = req?.user?.id || req?.user?.userId;
    return this.reelsService.recordEvent(reelId, dto, userId);
  }

  /**
   * Protected creator endpoint to retrieve aggregated Reel metrics.
   */
  @Get(':reelId/analytics')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getReelAnalytics(
    @CurrentUser() user: any,
    @Param('reelId') reelId: string,
  ) {
    return this.reelsService.getReelAnalytics(reelId, user.id);
  }

  /**
   * Initializes a Reel upload session and returns a secure server-signed Cloudinary payload.
   * Direct video bytes must be uploaded directly from the browser to Cloudinary CDN.
   */
  @Post('upload-signature')
  @UseGuards(ReelsFeatureGuard, JwtAuthGuard, ReelRateLimitGuard)
  @ReelThrottle(10, 60, 'upload-signature')
  @HttpCode(HttpStatus.OK)
  async createUploadSignature(
    @CurrentUser() user: any,
    @Body() dto: CreateUploadSignatureDto,
  ): Promise<UploadSignatureResponse> {
    return this.reelsService.createUploadSignature(user, dto);
  }

  /**
   * Server-to-server Cloudinary notification webhook endpoint.
   * Does NOT require user JWT authentication; authenticated using Cloudinary HMAC webhook signatures.
   * Uses exact raw request body string for signature verification. (Exempt from ReelsFeatureGuard)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: any,
    @Body() payload: any,
    @Headers('x-cld-signature') cldSig?: string,
    @Headers('x-cld-timestamp') cldTs?: string,
    @Headers('signature') sig?: string,
    @Headers('timestamp') ts?: string,
  ): Promise<WebhookProcessResponse> {
    const signature = cldSig || sig || payload.signature;
    const timestamp = cldTs || ts || payload.timestamp;
    const rawBodyString = req?.rawBody
      ? req.rawBody.toString('utf8')
      : typeof payload === 'string'
      ? payload
      : JSON.stringify(payload);

    return this.reelsService.processCloudinaryWebhook(
      payload,
      rawBodyString,
      signature,
      timestamp,
    );
  }
}
