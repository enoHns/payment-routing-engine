jest.mock('../../../../src/db/repositories/metricsRepo', () => ({
  getAllProviderCombinations: jest.fn().mockResolvedValue([
    { providerName: 'kkiapay', operator: 'MTN', country: 'BJ' },
  ]),
  getRecentMetrics: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../../../src/core/scoreCache', () => ({
  getCachedScore: jest.fn().mockResolvedValue(null),
  setCachedScore: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../src/core/metricsAggregator', () => ({
  getRecentProviderStats: jest.fn().mockResolvedValue({
    successCount: 10, failureCount: 2, totalLatencyMs: 20000, sampleCount: 10,
  }),
}));

import Fastify from 'fastify';
import { adminMetricsRoutes } from '../../../../src/routes/admin/metrics';

const buildApp = async () => {
  const app = Fastify();
  await app.register(adminMetricsRoutes);
  return app;
};

describe('GET /admin/metrics', () => {
  let app: ReturnType<typeof Fastify>;
  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it('returns 200 with scores', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/metrics' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(1);
    expect(body.data[0].providerName).toBe('kkiapay');
    expect(typeof body.data[0].score).toBe('number');
  });
});
