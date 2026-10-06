import { PaymentsService } from '../payments/payments.service.js';
import { MockRazorpayProvider } from '../payments/providers/mock-razorpay.provider.js';

describe('Payment & Webhook Idempotency Integration', () => {
  let paymentsService: PaymentsService;
  let mockPrisma: any;
  let mockProvider: MockRazorpayProvider;

  beforeEach(() => {
    mockPrisma = {
      payment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockProvider = new MockRazorpayProvider();
    paymentsService = new PaymentsService(mockPrisma, mockProvider);
  });

  it('should process payment webhook and generate invoice on first call', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({
      id: 'pay_rec_001',
      bookingId: 'bk_001',
      amount: 15000,
      status: 'PENDING',
      providerPaymentId: 'pay_mock_123',
    });

    mockPrisma.payment.update.mockResolvedValue({
      id: 'pay_rec_001',
      bookingId: 'bk_001',
      amount: 15000,
      status: 'PAID',
    });

    mockPrisma.booking.update.mockResolvedValue({
      id: 'bk_001',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    });

    mockPrisma.invoice.findFirst.mockResolvedValue(null);
    mockPrisma.invoice.create.mockResolvedValue({
      id: 'inv_001',
      invoiceNumber: 'INV-1001',
      amount: 15000,
      status: 'PAID',
    });

    const result = await paymentsService.handleWebhook({
      event: 'payment.captured',
      payload: { providerOrderId: 'order_mock_123', providerPaymentId: 'pay_mock_123' },
      signature: 'valid_sig',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'bk_001' },
      data: expect.objectContaining({ status: 'CONFIRMED', paymentStatus: 'PAID' }),
    });
    expect(mockPrisma.invoice.create).toHaveBeenCalled();
  });

  it('should handle duplicate webhook idempotently without recreating invoice or updating booking', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({
      id: 'pay_rec_001',
      bookingId: 'bk_001',
      amount: 15000,
      status: 'PAID', // Already PAID!
    });

    const result = await paymentsService.handleWebhook({
      event: 'payment.captured',
      payload: { providerOrderId: 'order_mock_123' },
      signature: 'valid_sig',
    });

    expect(result.success).toBe(true);
    expect((result as any).message).toContain('Idempotent response');
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
    expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
  });
});
