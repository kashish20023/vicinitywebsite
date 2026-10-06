import { Reflector } from '@nestjs/core';
import { CouponsController } from './coupons.controller.js';
import { CouponsService } from './coupons.service.js';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';

describe('CouponsController (Role-Based Access Control)', () => {
  let controller: CouponsController;
  let service: CouponsService;
  const reflector = new Reflector();

  beforeEach(() => {
    service = {
      createCoupon: jest.fn(),
      listCoupons: jest.fn(),
      validateCoupon: jest.fn(),
    } as unknown as CouponsService;

    controller = new CouponsController(service);
  });

  describe('Role Metadata Enforcement (Admin Only)', () => {
    it('POST /coupons requires ADMIN role and denies HOST', () => {
      const roles = reflector.get<UserRole[]>(ROLES_KEY, controller.createCoupon);
      expect(roles).toBeDefined();
      expect(roles).toEqual([UserRole.ADMIN]);
      expect(roles).not.toContain(UserRole.HOST);
    });

    it('GET /coupons requires ADMIN role and denies HOST', () => {
      const roles = reflector.get<UserRole[]>(ROLES_KEY, controller.listCoupons);
      expect(roles).toBeDefined();
      expect(roles).toEqual([UserRole.ADMIN]);
      expect(roles).not.toContain(UserRole.HOST);
    });

    it('POST /coupons/validate has no role restrictions (accessible to guests)', () => {
      const roles = reflector.get<UserRole[]>(ROLES_KEY, controller.validateCoupon);
      expect(roles).toBeUndefined();
    });
  });

  describe('Delegation to CouponsService', () => {
    it('calls couponsService.createCoupon with dto', async () => {
      const dto: any = { code: 'TEST10', discountType: 'FLAT', discountValue: 100 };
      (service.createCoupon as jest.Mock).mockResolvedValue({ id: 'cp_1', ...dto });

      const result = await controller.createCoupon(dto);
      expect(service.createCoupon).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'cp_1', ...dto });
    });

    it('calls couponsService.listCoupons', async () => {
      (service.listCoupons as jest.Mock).mockResolvedValue([{ id: 'cp_1' }]);

      const result = await controller.listCoupons();
      expect(service.listCoupons).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'cp_1' }]);
    });

    it('calls couponsService.validateCoupon with dto', async () => {
      const dto: any = { code: 'TEST10', orderAmount: 1000 };
      (service.validateCoupon as jest.Mock).mockResolvedValue({ valid: true, discountAmount: 100 });

      const result = await controller.validateCoupon(dto);
      expect(service.validateCoupon).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ valid: true, discountAmount: 100 });
    });
  });
});
