export interface CreatePaymentOrderInput {
  bookingId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentOrderResult {
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
}

export interface ProcessRefundInput {
  paymentId: string;
  providerPaymentId?: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  amount: number;
  status: string;
}

export interface IPaymentProvider {
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult>;
  verifyWebhookSignature(rawBody: string | object, signature: string): boolean;
  processRefund(input: ProcessRefundInput): Promise<RefundResult>;
}
