import axios from 'axios';
import crypto from 'crypto';
import { ProviderAdapter, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { env } from '../../config/env';
import logger from '../../config/logger';

const BASE_URL = 'https://app.paydunya.com/api/v1';
const TIMEOUT  = 10000;

export class PaydunyaAdapter implements ProviderAdapter {
  readonly name = 'paydunya';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const response = await axios.post(
      `${BASE_URL}/softpay/mobile-money-checkout`,
      {
        account_alias:  req.phone,
        amount:         req.amount,
        currency:       req.currency,
        description:    `Payment ${req.transactionId}`,
        callback_url:   req.webhookUrl,
        total_amount:   req.amount,
      },
      {
        headers: {
          'PAYDUNYA-MASTER-KEY':  env.PAYDUNYA_MASTER_KEY,
          'PAYDUNYA-PRIVATE-KEY': env.PAYDUNYA_PRIVATE_KEY,
          'PAYDUNYA-TOKEN':       env.PAYDUNYA_TOKEN,
          'Content-Type':         'application/json',
        },
        timeout: TIMEOUT,
      },
    );

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');

    return {
      providerTxId: response.data.token ?? response.data.hash,
      status: 'PENDING',
      rawResponse: response.data,
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha256', env.PAYDUNYA_MASTER_KEY)
      .update(body)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
