import { ProviderAdapter, ProviderIntegrationMode, PaymentRequest, PaymentResponse } from '../base/ProviderAdapter';
import { safeHmacCompare } from '../../utils/crypto';
import { kkiapayConfig } from './kkiapay.config';
import logger from '../../config/logger';

/**
 * KkiapayAdapter — REDIRECT integration mode.
 *
 * KKiaPay does not expose a server-side mobile-money collection API.
 * Payment is initiated by redirecting the customer to KKiaPay's hosted
 * checkout widget.  The engine builds a signed URL embedding the amount,
 * phone number, and a callback endpoint; the provider calls that endpoint
 * once the customer has confirmed payment on their device.
 *
 * Verification of incoming webhook payloads uses HMAC-SHA256 with the
 * KKIAPAY_HMAC_KEY configured in the dashboard (Webhook Secret).
 */
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
