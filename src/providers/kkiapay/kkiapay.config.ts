import { env } from '../../config/env';

export const kkiapayConfig = {
  privateKey: env.KKIAPAY_PRIVATE_KEY,
  publicKey:  env.KKIAPAY_PUBLIC_KEY,
  hmacKey:    env.KKIAPAY_HMAC_KEY,
  baseUrl:    env.KKIAPAY_BASE_URL,   // sandbox: https://sandbox-api.kkiapay.me
  timeout:    env.KKIAPAY_TIMEOUT_MS,
};
