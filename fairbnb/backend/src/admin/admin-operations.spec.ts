import { AdminService } from './admin.service.js';
import { UserRole } from '@prisma/client';

describe('Admin Operations (Guests, Hosts, Property Transfer)', () => {
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
        groupBy: jest.fn(),
      },
    };

    adminService = new AdminService(mockPrisma, { logAction: jest.fn() } as any);
  });

  describe('Guests Management', () => {
    it('should calculate trip counts, lifetime bookings, and total spent for guests', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'usr_guest_1',
          name: 'Jane Guest',
          role: UserRole.USER,
          isActive: true,
          bookings: [
            {
              id: 'b1',
              status: 'COMPLETED',
              paymentStatus: 'PAID',
              totalAmount: 15000,
            },
            {
              id: 'b2',
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
              totalAmount: 5000,
            },
          ],
        },
      ]);

      const guests = await adminService.getGuestsList();

      expect(guests).toHaveLength(1);
      expect(guests[0].metrics.totalBookingsCount).toBe(2);
      expect(guests[0].metrics.completedTripsCount).toBe(1);
      expect(guests[0].metrics.totalSpent).toBe(20000);
      expect(guests[0].isBlocked).toBe(false);
    });

    it('should block guest account and save block reason', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_guest_1',
        isActive: true,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'usr_guest_1',
        isActive: false,
        blockReason: 'Policy violation',
      });

      const result = await adminService.blockUnblockGuest(
        'usr_guest_1',
        true,
        'Policy violation',
      );

      expect(result.message).toContain('blocked successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr_guest_1' },
        data: { isActive: false, blockReason: 'Policy violation' },
      });
    });
  });

  describe('Hosts Management & Impersonation', () => {
    it('should return host directory with active properties count and superhost badge', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'usr_host_1',
          name: 'John Host',
          role: UserRole.HOST,
          isSuperhost: true,
          phoneVerified: true,
          emailVerified: true,
          properties: [
            {
              id: 'p1',
              status: 'PUBLISHED',
              verificationStatus: 'APPROVED',
              bookings: [{ totalAmount: 10000, paymentStatus: 'PAID' }],
            },
          ],
        },
      ]);

      const hosts = await adminService.getHostsList();

      expect(hosts).toHaveLength(1);
      expect(hosts[0].isSuperhost).toBe(true);
      expect(hosts[0].verificationBadge).toBe('VERIFIED');
      expect(hosts[0].metrics.activePropertiesCount).toBe(1);
      expect(hosts[0].metrics.totalRevenue).toBe(10000);
    });

    it('should generate impersonation context for a host', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_host_1',
        name: 'John Host',
        role: UserRole.HOST,
        isSuperhost: true,
        properties: [{ id: 'p1' }],
      });

      const result = await adminService.impersonateHost('usr_host_1');

      expect(result.impersonationContext.adminContext).toBe(true);
      expect(result.impersonationContext.impersonatedHostId).toBe('usr_host_1');
      expect(result.impersonationContext.propertiesCount).toBe(1);
    });
  });

  describe('Property Ownership Transfer', () => {
    it('should transfer property ownership from current host to new target host', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop_001',
        title: 'Goa Villa',
        hostId: 'old_host_1',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'new_host_2',
        name: 'New Host Owner',
        role: UserRole.HOST,
      });

      mockPrisma.property.update.mockResolvedValue({
        id: 'prop_001',
        title: 'Goa Villa',
        hostId: 'new_host_2',
      });

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'new_host_2',
          name: 'New Host Owner',
          email: 'host2@test.com',
          phone: '12345',
          role: UserRole.HOST,
        },
      ]);

      const result = await adminService.transferPropertyOwnership(
        'prop_001',
        'new_host_2',
      );

      expect(result.transferRecord.previousHostId).toBe('old_host_1');
      expect(result.transferRecord.newHostId).toBe('new_host_2');
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop_001' },
        data: { hostId: 'new_host_2' },
      });
    });
  });
});
