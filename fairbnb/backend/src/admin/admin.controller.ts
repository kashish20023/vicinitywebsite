import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import { AdminVerifyPropertyDto, AdminPropertyAction } from './dto/admin-verify-property.dto.js';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto.js';
import { AdminVerifyUserDto } from './dto/admin-verify-user.dto.js';
import { AdminTransferPropertyDto } from './dto/admin-transfer-property.dto.js';
import { AdminBlockGuestDto } from './dto/admin-block-guest.dto.js';
import { AdminKycVerifyDto } from './dto/admin-kyc-verify.dto.js';
import { AdminSendMessageDto } from './dto/admin-send-message.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================================
  // 1. OVERVIEW DASHBOARD
  // ============================================================================
  @Get('overview')
  async getOverview() {
    return this.adminService.getOverviewMetrics();
  }

  // ============================================================================
  // 2. USERS SUB-MODULE
  // ============================================================================

  /**
   * Users -> All Users: List all users with optional filters (role, search, isActive)
   */
  @Get('users')
  async getAllUsers(
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.adminService.getAllUsers({ role, search, isActive: activeBool });
  }

  /**
   * Users -> Hosts: List all hosts with property counts
   */
  @Get('users/hosts')
  async getHosts() {
    return this.adminService.getHosts();
  }

  /**
   * Users -> Verification: List users pending verification
   */
  @Get('users/verification')
  async getUsersPendingVerification() {
    return this.adminService.getUsersPendingVerification();
  }

  /**
   * Users -> Verification Action: Update phone/email verification status of a user
   */
  @Patch('users/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyUser(
    @Param('id') id: string,
    @Body() dto: AdminVerifyUserDto,
  ) {
    return this.adminService.verifyUser(id, dto);
  }

  /**
   * Users -> Blocked/Suspended: List all blocked/suspended users
   */
  @Get('users/blocked')
  async getBlockedUsers() {
    return this.adminService.getBlockedUsers();
  }

  /**
   * Users -> Block/Unblock Action: Update user active/blocked status
   */
  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  // ============================================================================
  // 3. PROPERTIES SUB-MODULE
  // ============================================================================

  /**
   * Properties -> All Properties: List all properties with filters
   */
  @Get('properties')
  async getAllProperties(
    @Query('status') status?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllProperties({
      status,
      verificationStatus,
      city,
      category,
      search,
    });
  }

  /**
   * Properties -> Pending Review: List properties pending review
   */
  @Get('properties/pending')
  async getPendingProperties() {
    return this.adminService.getPendingProperties();
  }

  /**
   * Properties -> Approved: List approved properties
   */
  @Get('properties/approved')
  async getApprovedProperties() {
    return this.adminService.getApprovedProperties();
  }

  /**
   * Properties -> Rejected: List rejected properties
   */
  @Get('properties/rejected')
  async getRejectedProperties() {
    return this.adminService.getRejectedProperties();
  }

  /**
   * Properties -> Verification Action: Approve or Reject a property
   */
  @Patch('properties/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyProperty(
    @Param('id') id: string,
    @Body() dto: AdminVerifyPropertyDto,
  ) {
    return this.adminService.verifyProperty(id, dto);
  }

  // ============================================================================
  // 4. GUESTS MANAGEMENT HUB (USER ROLE = GUEST)
  // ============================================================================

  /**
   * GET /admin/guests
   * List all Guests (role = USER) with trip counts, lifetime bookings, total spent, and block status.
   */
  @Get('guests')
  async getGuests(@Query('search') search?: string) {
    return this.adminService.getGuestsList(search);
  }

  /**
   * PATCH /admin/guests/:id/block
   * 1-Click block or unblock a Guest account with optional reason.
   */
  @Patch('guests/:id/block')
  @HttpCode(HttpStatus.OK)
  async blockGuest(
    @Param('id') id: string,
    @Body() dto: AdminBlockGuestDto,
  ) {
    return this.adminService.blockUnblockGuest(id, dto.isBlocked, dto.reason);
  }

  // ============================================================================
  // 5. HOSTS MANAGEMENT HUB & IMPERSONATION
  // ============================================================================

  /**
   * GET /admin/hosts
   * List all Hosts with active listings count, total revenue, and Superhost status.
   */
  @Get('hosts')
  async getHostsDirectory(@Query('search') search?: string) {
    return this.adminService.getHostsList(search);
  }

  /**
   * POST /admin/hosts/:id/impersonate
   * Generate Admin Host Impersonation context for dashboard preview.
   */
  @Post('hosts/:id/impersonate')
  @HttpCode(HttpStatus.OK)
  async impersonateHost(@Param('id') id: string) {
    return this.adminService.impersonateHost(id);
  }

  // ============================================================================
  // 6. PROPERTY OWNERSHIP TRANSFER
  // ============================================================================

  /**
   * POST /admin/properties/:id/transfer
   * Transfer property ownership from current host to a new host ID.
   */
  @Post('properties/:id/transfer')
  @HttpCode(HttpStatus.OK)
  async transferProperty(
    @Param('id') id: string,
    @Body() dto: AdminTransferPropertyDto,
  ) {
    return this.adminService.transferPropertyOwnership(id, dto.newHostId);
  }

  // ============================================================================
  // 7. PLATFORM STATS & FINANCIAL ANALYTICS
  // ============================================================================

  /**
   * GET /admin/stats
   * Platform-wide operational stats (pending verifications, pending approvals, total revenue).
   */
  @Get('stats')
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  /**
   * GET /admin/analytics/overview
   * Time-series revenue, GBV, ADR, and Occupancy Rate.
   */
  @Get('analytics/overview')
  async getAnalyticsOverview(
    @Query('range') range?: string,
    @Query('mode') mode?: string,
  ) {
    return this.adminService.getAnalyticsOverview(range, mode);
  }

  // ============================================================================
  // 8. IDENTITY & KYC VERIFICATION QUEUE
  // ============================================================================

  /**
   * GET /admin/verifications/pending
   * Retrieve list of users awaiting identity document / KYC review.
   */
  @Get('verifications/pending')
  async getPendingVerifications() {
    return this.adminService.getPendingVerifications();
  }

  /**
   * PUT /admin/users/:id/verify or PATCH /admin/users/:id/verify
   * Update user KYC verification status with feedback notes.
   */
  @Put('users/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyUserKycPut(
    @Param('id') id: string,
    @Body() dto: AdminKycVerifyDto,
  ) {
    return this.adminService.verifyUserKyc(id, dto);
  }

  // ============================================================================
  // 9. PROPERTY APPROVAL ALIASED ENDPOINTS
  // ============================================================================

  /**
   * PUT /admin/property/approve/:id
   * Approve & publish listing.
   */
  @Put('property/approve/:id')
  @HttpCode(HttpStatus.OK)
  async approvePropertyAlias(@Param('id') id: string) {
    return this.adminService.verifyProperty(id, { action: AdminPropertyAction.APPROVE });
  }

  /**
   * PUT /admin/property/reject/:id
   * Reject listing with optional feedback note.
   */
  @Put('property/reject/:id')
  @HttpCode(HttpStatus.OK)
  async rejectPropertyAlias(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.adminService.verifyProperty(id, {
      action: AdminPropertyAction.REJECT,
      rejectionReason,
    });
  }

  // ============================================================================
  // 10. FINANCIAL COLLECTIONS & DIRECT ADMIN MESSAGING
  // ============================================================================

  /**
   * GET /admin/collections
   * Summary of financial collections, service fees, and host payouts.
   */
  @Get('collections')
  async getFinancialCollections() {
    return this.adminService.getFinancialCollections();
  }

  /**
   * POST /admin/messages/send
   * Dispatch direct administrative notification to host or guest.
   */
  @Post('messages/send')
  @HttpCode(HttpStatus.OK)
  async sendAdminMessage(
    @CurrentUser() user: any,
    @Body() dto: AdminSendMessageDto,
  ) {
    return this.adminService.sendAdminMessage(user.id, dto);
  }

  /**
   * GET /admin/payouts
   * Retrieve payout requests list with optional status filter.
   */
  @Get('payouts')
  async getPayoutRequests(@Query('status') status?: string) {
    return this.adminService.getPayoutRequests(status);
  }

  /**
   * PATCH /admin/payouts/:id/approve
   * Approve host payout request and trigger automated financial transaction ledger entry.
   */
  @Patch('payouts/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approvePayoutRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.approvePayoutRequest(id, user.id);
  }

  // ============================================================================
  // 11. CO-HOST SUPERVISION HUB
  // ============================================================================

  /**
   * GET /admin/co-hosts
   * List all property co-host relationships with permissions & payout rules.
   */
  @Get('co-hosts')
  async getAllCoHosts(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllCoHosts(search, status);
  }

  @Get('co-hosts/:id')
  async getCoHostProfileDetail(@Param('id') id: string) {
    return this.adminService.getCoHostProfileDetail(id);
  }

  /**
   * GET /admin/hosts/:id
   * Fetch detailed host overview profile by host user ID.
   */
  @Get('hosts/:id')
  async getHostProfileDetail(@Param('id') id: string) {
    return this.adminService.getHostProfileDetail(id);
  }

  /**
   * PATCH /admin/co-hosts/:id/status
   * Administrative override to suspend or reactivate a Co-Host relationship.
   */
  @Patch('co-hosts/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateCoHostStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED',
  ) {
    return this.adminService.updateCoHostStatus(id, status);
  }
}


