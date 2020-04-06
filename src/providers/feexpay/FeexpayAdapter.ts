import axios from 'axios';
import crypto from 'crypto';
import { ProviderAdapter, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { env } from '../../config/env';
import logger from '../../config/logger';

const BASE_URL = 'https://api.feexpay.me/api';
const TIMEOUT  = 10000;

export class FeexpayAdapter implements ProviderAdapter {
  readonly name = 'feexpay';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const response = await axios.post(
      `${BASE_URL}/transactions/public/requesttopay`,
      {
        phonenumber: req.phone,
        amount:      req.amount,
        currency:    req.currency,
        callback:    req.webhookUrl,
        description: `Payment ${req.transactionId}`,
        id_merchant: env.FEEXPAY_SHOP_ID,
      },
      {
        headers: { Authorization: `Bearer ${env.FEEXPAY_API_KEY}` },
        timeout: TIMEOUT,
      },
    );

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');

    return {
      providerTxId: response.data.reference ?? response.data.id,
      status: 'PENDING',
      rawResponse: response.data,
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha256', env.FEEXPAY_API_KEY)
      .update(body)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
