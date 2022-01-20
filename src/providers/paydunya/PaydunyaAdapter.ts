import axios from 'axios';
import { ProviderAdapter, ProviderIntegrationMode, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { safeHmacCompare } from '../../utils/crypto';
import { env } from '../../config/env';
import logger from '../../config/logger';

export class PaydunyaAdapter implements ProviderAdapter {
  readonly name = 'paydunya';
  readonly integrationMode: ProviderIntegrationMode = 'DIRECT';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const response = await axios.post(`https://app.paydunya.com/api/v1/softpay/mobile-money-checkout`, {
      account_alias: req.phone, amount: req.amount, currency: req.currency,
      description: `Payment ${req.transactionId}`, callback_url: req.webhookUrl, total_amount: req.amount,
    }, {
      headers: {
        'PAYDUNYA-MASTER-KEY':  env.PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': env.PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN':       env.PAYDUNYA_TOKEN,
      },
      timeout: 10000,
    });

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');
    return { providerTxId: response.data.token ?? response.data.hash, status: 'PENDING', rawResponse: response.data };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return safeHmacCompare('sha256', env.PAYDUNYA_MASTER_KEY, body, signature);
  }
}
