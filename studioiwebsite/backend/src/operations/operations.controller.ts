import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OperationsService } from './operations.service';
import { CurrentUser } from '../common/current-user.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  // CHAT
  @Get('chat/:partnerId')
  @UseGuards(AuthGuard('jwt'))
  async getChatHistory(@Param('partnerId') partnerId: string, @CurrentUser() user: any) {
    return this.operationsService.getChatHistory(user.id, partnerId);
  }

  @Post('chat/send')
  @UseGuards(AuthGuard('jwt'))
  async sendChatMessage(
    @CurrentUser() user: any,
    @Body() dto: { receiverId: string; workspaceId?: string; message: string },
  ) {
    return this.operationsService.sendChatMessage(user.id, dto);
  }

  // MAINTENANCE
  @Post('maintenance/report')
  @UseGuards(AuthGuard('jwt'))
  async reportIssue(
    @CurrentUser() user: any,
    @Body() dto: { workspaceId: string; unitId?: string; title: string; description: string; priority?: string },
  ) {
    return this.operationsService.reportMaintenanceIssue(user.id, dto);
  }

  @Get('maintenance/issues')
  @UseGuards(AuthGuard('jwt'))
  async getIssues(@Query('workspaceId') workspaceId?: string) {
    return this.operationsService.getMaintenanceIssues(workspaceId);
  }

  @Patch('maintenance/issues/:id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async updateIssueStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.operationsService.updateIssueStatus(id, status);
  }

  // DISPUTES
  @Post('disputes/file')
  @UseGuards(AuthGuard('jwt'))
  async fileDispute(
    @CurrentUser() user: any,
    @Body() dto: { bookingId: string; reason: string },
  ) {
    return this.operationsService.fileDispute(user.id, dto);
  }

  @Get('disputes')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async getAllDisputes() {
    return this.operationsService.getAllDisputes();
  }

  @Post('disputes/:id/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: { resolutionNotes: string; status?: string },
  ) {
    return this.operationsService.resolveDispute(id, dto.resolutionNotes, dto.status);
  }

  // REVIEWS
  @Post('reviews')
  @UseGuards(AuthGuard('jwt'))
  async createReview(
    @CurrentUser() user: any,
    @Body() dto: { workspaceId: string; rating: number; comment?: string },
  ) {
    return this.operationsService.createReview(user.id, dto);
  }

  @Get('reviews/:workspaceId')
  async getReviews(@Param('workspaceId') workspaceId: string) {
    return this.operationsService.getWorkspaceReviews(workspaceId);
  }

  // BANNERS
  @Get('banners')
  async getActiveBanners() {
    return this.operationsService.getActiveBanners();
  }

  // WISHLIST
  @Get('wishlist')
  @UseGuards(AuthGuard('jwt'))
  async getWishlist(@CurrentUser() user: any) {
    return this.operationsService.getUserWishlist(user.id);
  }

  @Post('wishlist/toggle')
  @UseGuards(AuthGuard('jwt'))
  async toggleWishlist(
    @CurrentUser() user: any,
    @Body('workspaceId') workspaceId: string,
  ) {
    return this.operationsService.toggleWishlist(user.id, workspaceId);
  }
}
