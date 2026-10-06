import { AdminService } from './admin.service.js';

describe('Admin Flow Operations (Overview, KYC Review, Approvals, Collections, Messaging)', () => {
  let adminService: AdminService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      property: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      booking: {
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
      payoutRequest: {
        aggregate: jest.fn(),
      },
      adminMessage: {
        create: jest.fn(),
      },
    };

    adminService = new AdminService(mockPrisma, { logAction: jest.fn() } as any);
  });

  describe('Overview & Financial Analytics', () => {
    it('should return platform operational stats', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(3) // pending verifications
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(4) // total hosts
        .mockResolvedValueOnce(6); // total guests

      mockPrisma.property.count
        .mockResolvedValueOnce(2) // pending properties
        .mockResolvedValueOnce(8) // total properties
        .mockResolvedValueOnce(5); // published properties

      mockPrisma.booking.count.mockResolvedValue(12);
      mockPrisma.booking.aggregate.mockResolvedValue({
        _sum: { totalAmount: 120000 },
      });

      const res = await adminService.getPlatformStats();

      expect(res.stats.pendingVerificationsCount).toBe(3);
      expect(res.stats.pendingPropertiesCount).toBe(2);
      expect(res.stats.totalUsers).toBe(10);
      expect(res.stats.totalRevenue).toBe(120000);
    });

    it('should compute GBV, ADR, Occupancy Rate, and time-series analytics', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'b1',
          createdAt: new Date('2026-08-20'),
          nights: 3,
          baseAmount: 15000,
          totalAmount: 18000,
          status: 'COMPLETED',
        },
      ]);
      mockPrisma.property.count.mockResolvedValue(2);

      const analytics = await adminService.getAnalyticsOverview(
        '30d',
        'booked',
      );

      expect(analytics.kpis.grossBookingVolume).toBe(18000);
      expect(analytics.kpis.totalCompletedReservations).toBe(1);
      expect(analytics.kpis.averageDailyRate).toBe(5000); // 15000/3
      expect(analytics.timeSeries).toHaveLength(1);
    });
  });

  describe('Identity & KYC Verification Queue', () => {
    it('should update KYC verification status with feedback note', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_100',
        phoneVerified: false,
        emailVerified: false,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'usr_100',
        kycStatus: 'REJECTED',
        kycNote: 'Document image is blurry',
      });

      const res = await adminService.verifyUserKyc('usr_100', {
        status: 'REJECTED',
        feedbackNote: 'Document image is blurry',
      });

      expect(res.message).toContain('REJECTED');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr_100' },
        data: {
          kycStatus: 'REJECTED',
          kycNote: 'Document image is blurry',
          phoneVerified: false,
          emailVerified: false,
        },
      });
    });
  });

  describe('Financial Collections & Messaging', () => {
    it('should calculate platform financial collections & payouts summary', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'inv_1', invoiceNumber: 'INV-100', amount: 15000 },
      ]);
      mockPrisma.booking.aggregate.mockResolvedValue({
        _sum: { totalAmount: 150000, serviceFee: 15000 },
      });
      mockPrisma.payoutRequest.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } }) // pending
        .mockResolvedValueOnce({ _sum: { amount: 20000 } }); // approved

      const collections = await adminService.getFinancialCollections();

      expect(collections.financialSummary.totalCollectedVolume).toBe(150000);
      expect(collections.financialSummary.totalPlatformServiceFees).toBe(15000);
      expect(collections.financialSummary.totalPayoutsPending).toBe(5000);
    });

    it('should dispatch direct administrative message to user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_guest_1',
        name: 'John Guest',
        email: 'john@test.com',
      });
      mockPrisma.adminMessage.create.mockResolvedValue({
        id: 'msg_1',
        senderId: 'admin_1',
        recipientId: 'usr_guest_1',
        subject: 'Account Notice',
        content: 'Please verify your phone number.',
      });

      const res = await adminService.sendAdminMessage('admin_1', {
        recipientId: 'usr_guest_1',
        subject: 'Account Notice',
        content: 'Please verify your phone number.',
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.adminMessage.create).toHaveBeenCalled();
    });
  });
});
