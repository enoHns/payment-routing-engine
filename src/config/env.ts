import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  DATABASE_URL:             z.string().url(),
  REDIS_URL:                z.string().url(),
  PORT:                     z.coerce.number().default(3000),
  LOG_LEVEL:                z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  WEBHOOK_BASE_URL:         z.string().url(),
  KKIAPAY_PRIVATE_KEY:      z.string(),
  KKIAPAY_PUBLIC_KEY:       z.string(),
  KKIAPAY_HMAC_KEY:         z.string(),
  KKIAPAY_BASE_URL:         z.string().url().default('https://api.kkiapay.me'),
  FEDAPAY_SECRET_KEY:       z.string(),
  FEDAPAY_BASE_URL:         z.string().url().default('https://api.fedapay.com'),
  CINETPAY_API_KEY:         z.string(),
  CINETPAY_SITE_ID:         z.string(),
  CINETPAY_BASE_URL:        z.string().url().default('https://api-checkout.cinetpay.com'),
  FEEXPAY_API_KEY:          z.string(),
  FEEXPAY_SHOP_ID:          z.string(),
  FEEXPAY_HMAC_SECRET:      z.string(),
  FEEXPAY_BASE_URL:         z.string().url().default('https://api.feexpay.me'),
  PAYDUNYA_MASTER_KEY:      z.string(),
  PAYDUNYA_PRIVATE_KEY:     z.string(),
  PAYDUNYA_BASE_URL:        z.string().url().default('https://app.paydunya.com/api'),
  RATE_LIMIT_MAX:           z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS:     z.coerce.number().default(60000),
  MAX_FALLBACK_ATTEMPTS:    z.coerce.number().default(3),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;
