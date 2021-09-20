import { vi } from 'vitest';

vi.mock('../../../src/core/phoneResolver', () => ({
  tryResolveOperator: vi.fn().mockReturnValue({ country: 'BJ', operator: 'MTN' }),
}));
vi.mock('../../../src/utils/phone', () => ({
  normalizePhone: vi.fn().mockReturnValue('+22997000001'),
}));
vi.mock('../../../src/db/repositories', () => ({
  createTransaction:    vi.fn().mockResolvedValue({ id: 'tx-1', status: 'INITIATED', webhookUrl: null }),
  findByIdempotencyKey: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../../src/jobs/routingQueue', () => ({
  enqueueRoutingJob: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../src/config/env', () => ({
  env: {
    PORT: 3000,
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
    WEBHOOK_BASE_URL: 'https://example.com',
  },
}));

import Fastify from 'fastify';
import { paymentRoutes } from '../../../src/routes/payment';
import { tryResolveOperator } from '../../../src/core/phoneResolver';
import { findByIdempotencyKey } from '../../../src/db/repositories';

const buildApp = async () => {
  const app = Fastify();
  await app.register(paymentRoutes);
  return app;
};

describe('POST /payment (Zod validation)', () => {
  let app: ReturnType<typeof Fastify>;
  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it('returns 202 on valid request', async () => {
    const res = await app.inject({
      method: 'POST', url: '/payment',
      payload: { phone: '+22997000001', country: 'BJ', amount: 5000, currency: 'XOF' },
    });
    expect(res.statusCode).toBe(202);
    expect(JSON.parse(res.body).status).toBe('INITIATED');
  });

  it('returns 400 on missing amount', async () => {
    const res = await app.inject({
      method: 'POST', url: '/payment',
      payload: { phone: '+22997000001', currency: 'XOF' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 on negative amount', async () => {
    const res = await app.inject({
      method: 'POST', url: '/payment',
      payload: { phone: '+22997000001', amount: -100, currency: 'XOF' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 422 when operator not resolved', async () => {
    vi.mocked(tryResolveOperator).mockReturnValueOnce(null);
    const res = await app.inject({
      method: 'POST', url: '/payment',
      payload: { phone: '+33600000000', country: 'FR', amount: 1000, currency: 'EUR' },
    });
    expect(res.statusCode).toBe(422);
  });

  it('returns 202 on existing idempotencyKey', async () => {
    vi.mocked(findByIdempotencyKey).mockResolvedValueOnce({ id: 'tx-existing', status: 'PROCESSING' } as any);
    const res = await app.inject({
      method: 'POST', url: '/payment',
      payload: { phone: '+22997000001', country: 'BJ', amount: 5000, currency: 'XOF', idempotencyKey: '550e8400-e29b-41d4-a716-446655440000' },
    });
    expect(res.statusCode).toBe(202);
    expect(JSON.parse(res.body).transactionId).toBe('tx-existing');
  });
});
