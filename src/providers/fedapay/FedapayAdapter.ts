import axios from 'axios';
import crypto from 'crypto';
import { ProviderAdapter, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { env } from '../../config/env';
import logger from '../../config/logger';

const BASE_URL = 'https://api.fedapay.com/v1';
const TIMEOUT  = 10000;

export class FedapayAdapter implements ProviderAdapter {
  readonly name = 'fedapay';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const headers = {
      Authorization: `Bearer ${env.FEDAPAY_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    };

    // Step 1 — create transaction
    const createRes = await axios.post(
      `${BASE_URL}/transactions`,
      {
        description: `Mobile money payment ${req.transactionId}`,
        amount:      req.amount,
        currency:    { iso: req.currency },
        callback_url: req.webhookUrl,
        customer: {
          phone_number: { number: req.phone, country: req.country },
        },
      },
      { headers, timeout: TIMEOUT },
    );

    const txId = String(createRes.data.v1.transaction.id);

    // Step 2 — send the payment request
    await axios.post(
      `${BASE_URL}/transactions/${txId}/send_now`,
      {},
      { headers, timeout: TIMEOUT },
    );

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');

    return { providerTxId: txId, status: 'PENDING', rawResponse: createRes.data };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha512', env.FEDAPAY_PRIVATE_KEY)
      .update(body)
      .digest('hex');
    // constant-time compare
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
