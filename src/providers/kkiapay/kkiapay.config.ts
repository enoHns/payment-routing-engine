import { env } from '../../config/env';

export const kkiapayConfig = {
  privateKey: env.KKIAPAY_PRIVATE_KEY,
  publicKey:  env.KKIAPAY_PUBLIC_KEY,
  hmacKey:    env.KKIAPAY_HMAC_KEY,
  baseUrl:    env.KKIAPAY_BASE_URL,     // REST base (verify / refund / payout endpoints)
  widgetUrl:  env.KKIAPAY_WIDGET_URL,   // hosted checkout widget — used for collection
  timeout:    env.KKIAPAY_TIMEOUT_MS,
};
