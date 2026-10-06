import { InvestigationService } from './investigation/investigation.service.js';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TrustSafetyService } from './trust-safety.service.js';
import { SendMessageDto, ReviewCaseDto } from './dto/trust-safety.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { IdempotencyConflictError, ConcurrencyConflictError } from './persistence/trust-safety-persistence.interfaces.js';

@Controller('trust-safety')
export class TrustSafetyController {
  constructor(
    private readonly trustSafetyService: TrustSafetyService,
    private readonly investigationService: InvestigationService,
  ) {}

  /**
   * Authoritative server send path with inline deterministic moderation,
   * idempotency checking, case tracking, and outbox persistence.
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  public async sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
    const senderId = req.user?.id || req.user?.sub || 'anonymous';
    const senderRole = req.user?.role || 'GUEST';

    try {
      const result = await this.trustSafetyService.processSubmission({
        idempotencyKey: dto.idempotencyKey,
        senderId,
        recipientId: dto.recipientId,
        conversationId: dto.conversationId,
        propertyId: dto.propertyId,
        content: dto.content,
        context: {
          senderRole: senderRole as any,
        },
      });

      if (result.decision === 'BLOCK') {
        return {
          success: false,
          status: 'BLOCKED',
          decision: 'BLOCK',
          policyCode: 'CONTACT_INFO_POLICY_VIOLATION',
          reasons: result.reasons,
          attemptId: result.attemptId,
          caseId: result.caseId,
          message: 'Message could not be delivered because it contains restricted direct contact information.',
        };
      }

      if (result.decision === 'HOLD') {
        return {
          success: false,
          status: 'PENDING_REVIEW',
          decision: 'HOLD',
          policyCode: 'UNDER_SAFETY_REVIEW',
          attemptId: result.attemptId,
          caseId: result.caseId,
          message: 'Message is held for safety review and has not been delivered to the recipient.',
        };
      }

      return {
        success: true,
        status: 'DELIVERED',
        decision: 'ALLOW',
        attemptId: result.attemptId,
        message: 'Message sent successfully.',
      };
    } catch (err: any) {
      if (err instanceof IdempotencyConflictError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  /**
   * Sender status lookup for an evaluated submission.
   */
  @Get('submission/:attemptId')
  @UseGuards(JwtAuthGuard)
  public async getSubmissionStatus(@Request() req: any, @Param('attemptId') attemptId: string) {
    const userId = req.user?.id || req.user?.sub;
    const userRole = req.user?.role;

    // In-memory repo lookup
    const repo = this.trustSafetyService.getRepository();
    const attempt = Array.from((repo as any).attemptsById.values() as any[])
      .find((a: any) => a.id === attemptId);

    if (!attempt) {
      throw new NotFoundException('Submission attempt not found');
    }

    if (attempt.senderId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to view this submission status');
    }

    return {
      attemptId: attempt.id,
      decision: attempt.decision,
      status: attempt.decision === 'ALLOW' ? 'DELIVERED' : (attempt.decision === 'HOLD' ? 'PENDING_REVIEW' : 'BLOCKED'),
      createdAt: attempt.createdAt,
    };
  }

  /**
   * Filtered recipient conversation view:
   * Guarantees zero blocked or pending-held messages appear in recipient history,
   * unread counters, or snippets.
   */
  @Get('conversations/:conversationId/recipient-view')
  @UseGuards(JwtAuthGuard)
  public async getRecipientConversationView(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const recipientId = req.user?.id || req.user?.sub;
    const repo = this.trustSafetyService.getRepository();

    // Query attempts in conversation
    const attempts = Array.from((repo as any).attemptsById.values() as any[])
      .filter((a: any) => a.conversationId === conversationId);

    // Only ALLOW decisions are delivered to recipient
    const delivered = attempts.filter((a: any) => a.decision === 'ALLOW');
    const blockedCount = attempts.filter((a: any) => a.decision === 'BLOCK').length;
    const heldCount = attempts.filter((a: any) => a.decision === 'HOLD').length;

    return {
      conversationId,
      recipientId,
      deliveredMessagesCount: delivered.length,
      blockedSuppressedCount: blockedCount,
      heldSuppressedCount: heldCount,
      messages: delivered.map((d: any) => ({
        id: d.id,
        senderId: d.senderId,
        createdAt: d.createdAt,
      })),
      previewSnippet: delivered.length > 0 ? 'Message delivered' : null,
      recipientHasZeroBlockedContent: true,
    };
  }

  /**
   * Admin endpoint: Case queue listing
   */
  @Get('admin/cases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async listCases(
    @Query('status') status?: any,
    @Query('priority') priority?: any,
    @Query('senderId') senderId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.trustSafetyService.listCases({
      status,
      priority,
      senderId,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * Admin endpoint: Case detail with masked evidence
   */
  @Get('admin/cases/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async getCase(@Param('id') id: string) {
    const found = await this.trustSafetyService.getCaseById(id);
    if (!found) {
      throw new NotFoundException(`Case ${id} not found`);
    }
    return found;
  }

  /**
   * Admin endpoint: Review case decision with concurrency check
   */
  
  /**
   * Admin endpoint: Audited unmasking of protected contact evidence.
   * Records immutable audit log entry in case history and timeline.
   */
  @Post('admin/cases/:id/reveal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async revealCase(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const adminId = req.user?.id || req.user?.sub || 'admin_user';
    const found = await this.trustSafetyService.getCaseById(id);
    if (!found) {
      throw new NotFoundException(`Case ${id} not found`);
    }

    const result = await this.trustSafetyService.revealCaseEvidence(id, adminId, 'ADMIN');
    return {
      caseId: id,
      revealedContent: result.rawEvidence,
      auditActionId: result.action.actionId,
      timestamp: result.action.timestamp,
    };
  }

  @Post('admin/cases/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async reviewCase(
    @Request() req: any,
    @Param('id') id: string,
    @Query('version') version: string,
    @Body() dto: ReviewCaseDto,
  ) {
    const adminId = req.user?.id || req.user?.sub || 'admin_user';
    const expectedVersion = parseInt(version, 10);

    if (isNaN(expectedVersion)) {
      throw new BadRequestException('Query parameter "version" is required and must be an integer');
    }

    try {
      return await this.trustSafetyService.reviewCase(id, expectedVersion, {
        actorId: adminId,
        reason: dto.reason,
        newStatus: dto.newStatus,
        notes: dto.notes,
      });
    } catch (err: any) {
      if (err instanceof ConcurrencyConflictError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  /**
   * Admin endpoint: User moderation statistics
   */
  @Get('admin/users/:userId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async getUserStats(@Param('userId') userId: string) {
    return this.trustSafetyService.getUserStats(userId);
  }

  /**
   * Admin endpoint: User Profile investigation view (Section 7.1)
   */
  @Get('admin/users/:userId/investigation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async getUserInvestigation(@Param('userId') userId: string) {
    return this.investigationService.getUserProfile(userId);
  }

  /**
   * Admin endpoint: Property investigation view (Section 7.2)
   */
  @Get('admin/properties/:propertyId/investigation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async getPropertyInvestigation(@Param('propertyId') propertyId: string) {
    return this.investigationService.getPropertyView(propertyId);
  }

  /**
   * Admin endpoint: Activity Timeline view (Section 7.3)
   */
  @Get('admin/timeline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  public async getTimeline(
    @Query('targetEntity') targetEntity?: string,
    @Query('targetId') targetId?: string,
    @Query('actorId') actorId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.investigationService.getTimeline({
      targetEntity,
      targetId,
      actorId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

}
