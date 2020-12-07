jest.mock('../../../src/core/phoneResolver', () => ({
  tryResolveOperator: jest.fn().mockReturnValue({ country: 'BJ', operator: 'MTN' }),
}));
jest.mock('../../../src/utils/phone', () => ({
  normalizePhone: jest.fn().mockReturnValue('+22997000001'),
}));
jest.mock('../../../src/db/repositories/transactionRepo', () => ({
  createTransaction:      jest.fn().mockResolvedValue({ id: 'tx-1', status: 'INITIATED', webhookUrl: null }),
  findByIdempotencyKey:   jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../src/jobs/routingQueue', () => ({
  enqueueRoutingJob: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/config/env', () => ({
  env: {
    PORT: 3000,
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
    WEBHOOK_BASE_URL: 'https://example.com',
  },
}));
jest.mock('../../../src/cache/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue({ duplicate: jest.fn(), status: 'ready' }),
}));

import Fastify from 'fastify';
import { paymentRoutes } from '../../../src/routes/payment';

const buildApp = async () => {
  const app = Fastify();
  await app.register(paymentRoutes);
  return app;
};

describe('POST /payment', () => {
  let app: ReturnType<typeof Fastify>;
  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it('returns 202 with transactionId', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/payment',
      payload: { phone: '+22997000001', amount: 5000, currency: 'XOF' },
    });
    expect(res.statusCode).toBe(202);
    const body = JSON.parse(res.body);
    expect(body.transactionId).toBe('tx-1');
    expect(body.status).toBe('INITIATED');
  });

  it('returns 400 on missing amount', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/payment',
      payload: { phone: '+22997000001', currency: 'XOF' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 422 when operator unresolvable', async () => {
    const { tryResolveOperator } = jest.requireMock('../../../src/core/phoneResolver') as any;
    tryResolveOperator.mockReturnValueOnce(null);
    const res = await app.inject({
      method: 'POST',
      url:    '/payment',
      payload: { phone: '+333000000', amount: 1000, currency: 'EUR' },
    });
    expect(res.statusCode).toBe(422);
  });
});
