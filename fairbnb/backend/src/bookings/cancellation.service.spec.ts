import { CancellationService } from './cancellation.service.js';

describe('CancellationService', () => {
  let cancellationService: CancellationService;

  beforeEach(() => {
    cancellationService = new CancellationService();
  });

  it('should calculate 100% refund for FLEXIBLE policy >24h before check-in', () => {
    const checkIn = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours in future
    const result = cancellationService.calculateRefund('FLEXIBLE', checkIn, 10000);

    expect(result.cancellable).toBe(true);
    expect(result.policy).toBe('FLEXIBLE');
    expect(result.refundPercentage).toBe(100);
    expect(result.refundAmount).toBe(10000);
    expect(result.cancellationFee).toBe(0);
  });

  it('should calculate 50% refund for FLEXIBLE policy <24h before check-in', () => {
    const checkIn = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours in future
    const result = cancellationService.calculateRefund('FLEXIBLE', checkIn, 10000);

    expect(result.refundPercentage).toBe(50);
    expect(result.refundAmount).toBe(5000);
    expect(result.cancellationFee).toBe(5000);
  });

  it('should calculate MODERATE policy refund tiers correctly', () => {
    const checkIn6Days = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    const checkIn3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const checkIn1Day = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

    expect(cancellationService.calculateRefund('MODERATE', checkIn6Days, 10000).refundPercentage).toBe(100);
    expect(cancellationService.calculateRefund('MODERATE', checkIn3Days, 10000).refundPercentage).toBe(50);
    expect(cancellationService.calculateRefund('MODERATE', checkIn1Day, 10000).refundPercentage).toBe(0);
  });

  it('should calculate STRICT policy refund tiers correctly', () => {
    const checkIn15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const checkIn10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const checkIn3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    expect(cancellationService.calculateRefund('STRICT', checkIn15Days, 10000).refundPercentage).toBe(100);
    expect(cancellationService.calculateRefund('STRICT', checkIn10Days, 10000).refundPercentage).toBe(50);
    expect(cancellationService.calculateRefund('STRICT', checkIn3Days, 10000).refundPercentage).toBe(0);
  });
});
