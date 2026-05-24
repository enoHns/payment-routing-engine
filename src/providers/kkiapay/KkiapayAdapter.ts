import { ProviderAdapter, ProviderIntegrationMode, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { safeHmacCompare } from '../../utils/crypto';
import { kkiapayConfig } from './kkiapay.config';
import logger from '../../config/logger';

export class KkiapayAdapter implements ProviderAdapter {
  readonly name = 'kkiapay';
  readonly integrationMode: ProviderIntegrationMode = 'REDIRECT';

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const params = new URLSearchParams({
      amount:   String(req.amount),
      currency: req.currency,
      key:      kkiapayConfig.publicKey,
      phone:    req.phone,
      callback: req.webhookUrl,
      data:     JSON.stringify({ referenceId: req.transactionId }),
    });

    const checkoutUrl = `${kkiapayConfig.widgetUrl}?${params.toString()}`;

    logger.debug(
      { transactionId: req.transactionId, provider: this.name, checkoutUrl },
      'Redirect checkout URL generated',
    );

    return {
      providerTxId: req.transactionId,
      status:       'REQUIRES_REDIRECT',
      checkoutUrl,
      rawResponse:  { checkoutUrl },
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return safeHmacCompare('sha256', kkiapayConfig.hmacKey, body, signature);
  }
}
