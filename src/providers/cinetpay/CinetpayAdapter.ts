import axios from 'axios';
import { ProviderAdapter, ProviderIntegrationMode, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { env } from '../../config/env';
import logger from '../../config/logger';

const BASE_URL = 'https://api-checkout.cinetpay.com/v2';
const TIMEOUT  = 10000;

export class CinetpayAdapter implements ProviderAdapter {
  readonly name = 'cinetpay';
  readonly integrationMode: ProviderIntegrationMode = 'DIRECT';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const response = await axios.post(
      `${BASE_URL}/payment`,
      {
        apikey:                env.CINETPAY_API_KEY,
        site_id:               env.CINETPAY_SITE_ID,
        transaction_id:        req.transactionId,
        amount:                req.amount,
        currency:              req.currency,
        description:           `Payment ${req.transactionId}`,
        return_url:            req.webhookUrl,
        notify_url:            req.webhookUrl,
        customer_phone_number: req.phone,
        channels:              'MOBILE_MONEY',
        lang:                  'fr',
      },
      { timeout: TIMEOUT },
    );

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');

    return {
      providerTxId: req.transactionId, // CinetPay uses our ID
      status: 'PENDING',
      rawResponse: response.data,
    };
  }

  verifyWebhook(payload: unknown, _signature?: string): boolean {
    // CinetPay doesn't send a signature — they rely on IP allowlisting.
    // IMPORTANT: the network must only accept inbound webhooks from CinetPay IPs.
    // Without that, any caller knowing the payload shape can fake a webhook.
    if (typeof payload !== 'object' || payload === null) return false;
    const p = payload as Record<string, unknown>;
    return typeof p.cpm_trans_id === 'string' && typeof p.cpm_result === 'string';
  }
}
