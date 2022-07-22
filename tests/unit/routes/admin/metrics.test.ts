import { vi } from 'vitest';

vi.mock('../../../../src/db/repositories/metricsRepo', () => ({
  getAllProviderCombinations: vi.fn().mockResolvedValue([
    { providerName: 'kkiapay', operator: 'MTN', country: 'BJ' },
  ]),
  getRecentMetrics: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../../../src/core/scoreCache', () => ({
  getCachedScore: vi.fn().mockResolvedValue(null),
  setCachedScore: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../src/core/metricsAggregator', () => ({
  getRecentProviderStats: vi.fn().mockResolvedValue({
    successCount: 10, failureCount: 2, totalLatencyMs: 20000, sampleCount: 10,
  }),
}));
vi.mock('../../../../src/config/env', () => ({
  env: {
    PORT: 3000,
    ADMIN_API_KEY: undefined,
  },
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

  it('returns 200 with scores (no auth when ADMIN_API_KEY not set)', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/metrics' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(1);
    expect(body.data[0].providerName).toBe('kkiapay');
    expect(typeof body.data[0].score).toBe('number');
  });
});
