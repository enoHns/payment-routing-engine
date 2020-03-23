export interface PaymentRequest {
  transactionId: string;
  phone: string;
  amount: number;
  currency: string;
  country: string;
  operator: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  providerTxId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  rawResponse?: unknown;
}

export interface ProviderAdapter {
  readonly name: string;
  initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyWebhook(payload: unknown, signature?: string): boolean;
}
