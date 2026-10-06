import { PricingService } from './pricing.service.js';

describe('PricingService', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  it('should accurately calculate price breakdown for 3 nights', () => {
    const result = pricingService.calculatePricing({
      basePrice: 5000,
      checkIn: '2026-09-10',
      checkOut: '2026-09-13',
      cleaningFee: 1000,
      serviceFeeRate: 0.1,
      taxRate: 0.18,
    });

    expect(result.nights).toBe(3);
    expect(result.baseAmount).toBe(15000); // 5000 * 3
    expect(result.cleaningFee).toBe(1000);
    expect(result.serviceFee).toBe(1500); // 10% of 15000
    expect(result.taxAmount).toBe(3150); // 18% of (15000 + 1000 + 1500)
    expect(result.discountAmount).toBe(0);
    expect(result.totalAmount).toBe(20650);
  });

  it('should apply discountAmount correctly', () => {
    const result = pricingService.calculatePricing({
      basePrice: 5000,
      checkIn: '2026-09-10',
      checkOut: '2026-09-13',
      cleaningFee: 1000,
      discountAmount: 1500,
    });

    expect(result.discountAmount).toBe(1500);
    expect(result.totalAmount).toBe(19150);
  });

  it('should throw error if checkOut is before checkIn', () => {
    expect(() =>
      pricingService.calculatePricing({
        basePrice: 5000,
        checkIn: '2026-09-13',
        checkOut: '2026-09-10',
      }),
    ).toThrow('checkOut date must be strictly after checkIn date');
  });
});
