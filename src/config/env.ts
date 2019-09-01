import Joi from '@hapi/joi';
import dotenv from 'dotenv';

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),

  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),

  API_KEY_HEADER: Joi.string().default('X-API-Key'),
  MERCHANT_API_KEYS: Joi.string().required(),
  WEBHOOK_BASE_URL: Joi.string().uri().required(),

  KKIAPAY_PUBLIC_KEY: Joi.string().required(),
  KKIAPAY_PRIVATE_KEY: Joi.string().required(),
  KKIAPAY_SECRET_KEY: Joi.string().required(),
  KKIAPAY_BASE_URL: Joi.string().uri().default('https://api.kkiapay.me'),
  KKIAPAY_SANDBOX: Joi.boolean().default(false),

  FEDAPAY_SECRET_KEY: Joi.string().required(),
  FEDAPAY_BASE_URL: Joi.string().uri().default('https://api.fedapay.com/v1'),
  FEDAPAY_SANDBOX: Joi.boolean().default(false),

  CINETPAY_API_KEY: Joi.string().required(),
  CINETPAY_SITE_ID: Joi.string().required(),
  CINETPAY_BASE_URL: Joi.string().uri().default('https://api-checkout.cinetpay.com/v2'),

  FEEXPAY_API_KEY: Joi.string().required(),
  FEEXPAY_BASE_URL: Joi.string().uri().default('https://api.feexpay.me'),

  PAYDUNYA_MASTER_KEY: Joi.string().required(),
  PAYDUNYA_PRIVATE_KEY: Joi.string().required(),
  PAYDUNYA_TOKEN: Joi.string().required(),
  PAYDUNYA_BASE_URL: Joi.string().uri().default('https://app.paydunya.com/api/v1'),

  MAX_ATTEMPTS_PER_TRANSACTION: Joi.number().integer().min(1).max(5).default(3),
  SCORING_WINDOW_HOURS: Joi.number().integer().min(1).max(24).default(1),
  SCORING_MIN_SAMPLES: Joi.number().integer().min(1).default(10),
  DEFAULT_CURRENCY: Joi.string().default('XOF'),

  STATUS_POLL_INTERVAL_MS: Joi.number().integer().default(5000),
  STATUS_POLL_MAX_ATTEMPTS: Joi.number().integer().default(12),
  WEBHOOK_RETRY_ATTEMPTS: Joi.number().integer().default(5),
  WEBHOOK_RETRY_BACKOFF_MS: Joi.number().integer().default(1000),
});

const { error, value } = schema.validate(process.env, { allowUnknown: true, abortEarly: false });

if (error) {
  const details = error.details.map((d: { message: string }) => `  - ${d.message}`).join('\n');
  throw new Error(`Config validation failed:\n${details}`);
}

export const env = value as {
  NODE_ENV: string;
  PORT: number;
  LOG_LEVEL: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  API_KEY_HEADER: string;
  MERCHANT_API_KEYS: string;
  WEBHOOK_BASE_URL: string;
  KKIAPAY_PUBLIC_KEY: string;
  KKIAPAY_PRIVATE_KEY: string;
  KKIAPAY_SECRET_KEY: string;
  KKIAPAY_BASE_URL: string;
  KKIAPAY_SANDBOX: boolean;
  FEDAPAY_SECRET_KEY: string;
  FEDAPAY_BASE_URL: string;
  FEDAPAY_SANDBOX: boolean;
  CINETPAY_API_KEY: string;
  CINETPAY_SITE_ID: string;
  CINETPAY_BASE_URL: string;
  FEEXPAY_API_KEY: string;
  FEEXPAY_BASE_URL: string;
  PAYDUNYA_MASTER_KEY: string;
  PAYDUNYA_PRIVATE_KEY: string;
  PAYDUNYA_TOKEN: string;
  PAYDUNYA_BASE_URL: string;
  MAX_ATTEMPTS_PER_TRANSACTION: number;
  SCORING_WINDOW_HOURS: number;
  SCORING_MIN_SAMPLES: number;
  DEFAULT_CURRENCY: string;
  STATUS_POLL_INTERVAL_MS: number;
  STATUS_POLL_MAX_ATTEMPTS: number;
  WEBHOOK_RETRY_ATTEMPTS: number;
  WEBHOOK_RETRY_BACKOFF_MS: number;
};
