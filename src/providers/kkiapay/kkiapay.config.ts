import { env } from '../../config/env';

export const kkiapayConfig = {
  privateKey: env.KKIAPAY_PRIVATE_KEY,
  publicKey:  env.KKIAPAY_PUBLIC_KEY,
  hmacKey:    env.KKIAPAY_HMAC_KEY,
  baseUrl:    'https://api.kkiapay.me',
  timeout:    10000,
};
