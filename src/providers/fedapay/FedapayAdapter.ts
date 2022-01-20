import axios from 'axios';
import { ProviderAdapter, ProviderIntegrationMode, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { safeHmacCompare } from '../../utils/crypto';
import { env } from '../../config/env';
import logger from '../../config/logger';

export class FedapayAdapter implements ProviderAdapter {
  readonly name = 'fedapay';
  readonly integrationMode: ProviderIntegrationMode = 'DIRECT';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const headers = { Authorization: `Bearer ${env.FEDAPAY_PRIVATE_KEY}`, 'Content-Type': 'application/json' };
    const createRes = await axios.post(`https://api.fedapay.com/v1/transactions`, {
      description:  `Payment ${req.transactionId}`,
      amount:       req.amount,
      currency:     { iso: req.currency },
      callback_url: req.webhookUrl,
      customer:     { phone_number: { number: req.phone, country: req.country } },
    }, { headers, timeout: 10000 });

    const txId = String(createRes.data.v1.transaction.id);
    await axios.post(`https://api.fedapay.com/v1/transactions/${txId}/send_now`, {}, { headers, timeout: 10000 });

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');
    return { providerTxId: txId, status: 'PENDING', rawResponse: createRes.data };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return safeHmacCompare('sha512', env.FEDAPAY_PRIVATE_KEY, body, signature);
  }
}
