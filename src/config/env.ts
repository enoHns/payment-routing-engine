import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  DATABASE_URL:             z.string().url(),
  REDIS_URL:                z.string().url(),
  PORT:                     z.coerce.number().default(3000),
  LOG_LEVEL:                z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  WEBHOOK_BASE_URL:         z.string().url(),

  // ── KKiaPay (required — primary provider) ──────────────────────────────
  KKIAPAY_PRIVATE_KEY:      z.string().min(1),
  KKIAPAY_PUBLIC_KEY:       z.string().min(1),
  // HMAC key used to verify incoming KKiaPay webhooks (= KKIAPAY_WEBHOOK_SECRET in their dashboard)
  KKIAPAY_HMAC_KEY:         z.string().min(1),
  KKIAPAY_BASE_URL:         z.string().url().default('https://api.kkiapay.me'),
  // KKiaPay uses a hosted widget for collection (no server-side initiation API).
  // KKIAPAY_WIDGET_URL is the base URL of the checkout widget the engine redirects to.
  KKIAPAY_WIDGET_URL:       z.string().url().default('https://app.kkiapay.me'),
  KKIAPAY_TIMEOUT_MS:       z.coerce.number().default(30000),

  // ── FedaPay (optional) ─────────────────────────────────────────────────
  FEDAPAY_PRIVATE_KEY:       z.string().default(''),
  FEDAPAY_WEBHOOK_SECRET:    z.string().default(''),
  FEDAPAY_BASE_URL:          z.string().url().default('https://api.fedapay.com'),

  // ── CinetPay (optional) ────────────────────────────────────────────────
  CINETPAY_API_KEY:         z.string().default(''),
  CINETPAY_SITE_ID:         z.string().default(''),
  CINETPAY_BASE_URL:        z.string().url().default('https://api-checkout.cinetpay.com'),

  // ── FeexPay (optional) ─────────────────────────────────────────────────
  FEEXPAY_API_KEY:          z.string().default(''),
  FEEXPAY_SHOP_ID:          z.string().default(''),
  FEEXPAY_HMAC_SECRET:      z.string().default(''),
  FEEXPAY_BASE_URL:         z.string().url().default('https://api.feexpay.me'),

  // ── PayDunya (optional) ────────────────────────────────────────────────
  PAYDUNYA_MASTER_KEY:      z.string().default(''),
  PAYDUNYA_PRIVATE_KEY:     z.string().default(''),
  PAYDUNYA_TOKEN:           z.string().default(''),
  PAYDUNYA_BASE_URL:        z.string().url().default('https://app.paydunya.com/api'),

  RATE_LIMIT_MAX:           z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS:     z.coerce.number().default(60000),
  MAX_FALLBACK_ATTEMPTS:    z.coerce.number().default(3),
  // Optional: when set, GET /admin/metrics requires x-api-key header
  ADMIN_API_KEY:            z.string().optional(),
});
// Note: no .strict() — process.env contains many OS variables that are not part of the schema

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;
