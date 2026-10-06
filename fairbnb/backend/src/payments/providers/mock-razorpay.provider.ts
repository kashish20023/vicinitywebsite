import { Injectable } from '@nestjs/common';
import {
  IPaymentProvider,
  CreatePaymentOrderInput,
  PaymentOrderResult,
  ProcessRefundInput,
  RefundResult,
} from '../interfaces/payment-provider.interface.js';
import { randomUUID } from 'crypto';

@Injectable()
export class MockRazorpayProvider implements IPaymentProvider {
  async createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    const providerOrderId = `order_mock_${randomUUID().replace(/-/g, '').slice(0, 14)}`;
    const providerPaymentId = `pay_mock_${randomUUID().replace(/-/g, '').slice(0, 14)}`;

    return {
      providerOrderId,
      providerPaymentId,
      amount: input.amount,
      currency: input.currency || 'INR',
      provider: 'MOCK_RAZORPAY',
      status: 'CREATED',
    };
  }

  verifyWebhookSignature(rawBody: any, signature: string): boolean {
    // In mock provider, signature is valid if provided or matching secret
    if (!signature) return true;
    return signature !== 'invalid_sig';
  }

  async processRefund(input: ProcessRefundInput): Promise<RefundResult> {
    const providerRefundId = `rfnd_mock_${randomUUID().replace(/-/g, '').slice(0, 14)}`;

    return {
      providerRefundId,
      amount: input.amount,
      status: 'PROCESSED',
    };
  }
}
