export type ProviderIntegrationMode = 'DIRECT' | 'REDIRECT';

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
  status: 'PENDING' | 'REQUIRES_REDIRECT' | 'SUCCESS' | 'FAILED';
  checkoutUrl?: string;
  rawResponse?: unknown;
}

export interface ProviderAdapter {
  readonly name: string;
  readonly integrationMode: ProviderIntegrationMode;
  initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyWebhook(payload: unknown, signature?: string): boolean;
}
