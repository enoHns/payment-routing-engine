import axios from 'axios';
import { ProviderAdapter, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { safeHmacCompare } from '../../utils/crypto';
import { kkiapayConfig } from './kkiapay.config';
import logger from '../../config/logger';

export class KkiapayAdapter implements ProviderAdapter {
  readonly name = 'kkiapay';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const url = `${kkiapayConfig.baseUrl}/api/v1/transactions/mobile-money`;
    const body = {
      phoneNumber: req.phone,
      amount:      req.amount,
      currency:    req.currency,
      callback:    req.webhookUrl,
      partnerData: { referenceId: req.transactionId },
    };

    const response = await axios.post(url, body, {
      headers: { 'x-secret-key': kkiapayConfig.privateKey },
      timeout: kkiapayConfig.timeout,
    });

    logger.debug({ transactionId: req.transactionId, provider: this.name }, 'Payment initiated');
    return { providerTxId: response.data.transactionId, status: 'PENDING', rawResponse: response.data };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return safeHmacCompare('sha256', kkiapayConfig.hmacKey, body, signature);
  }
}
