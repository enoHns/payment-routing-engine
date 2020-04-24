import axios from 'axios';
import { ProviderAdapter, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { safeHmacCompare } from '../../utils/crypto';
import { env } from '../../config/env';
import logger from '../../config/logger';

export class FeexpayAdapter implements ProviderAdapter {
  readonly name = 'feexpay';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const response = await axios.post(`https://api.feexpay.me/api/transactions/public/requesttopay`, {
      phonenumber: req.phone, amount: req.amount, currency: req.currency,
      callback: req.webhookUrl, description: `Payment ${req.transactionId}`, id_merchant: env.FEEXPAY_SHOP_ID,
    }, { headers: { Authorization: `Bearer ${env.FEEXPAY_API_KEY}` }, timeout: 10000 });

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');
    return { providerTxId: response.data.reference ?? response.data.id, status: 'PENDING', rawResponse: response.data };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return safeHmacCompare('sha256', env.FEEXPAY_API_KEY, body, signature);
  }
}
