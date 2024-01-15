import { upsertMetricWindow, getRecentMetrics } from '../../src/db/repositories/metricsRepo';
import { connectWithRetry, disconnectPrisma } from '../../src/db/prismaClient';

const TEST_DB = process.env.TEST_DATABASE_URL;
const describeIfDb = TEST_DB ? describe : describe.skip;

describeIfDb('metricsRepo (integration)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB!;
    await connectWithRetry();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('creates a new metric window on first success', async () => {
    const windowStart = new Date();
    windowStart.setMinutes(0, 0, 0);
    await upsertMetricWindow('kkiapay', 'MTN', 'BJ', windowStart, 'SUCCESS', 2500);

    const metrics = await getRecentMetrics('kkiapay', 'MTN', 'BJ', 1);
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0].successCount).toBeGreaterThanOrEqual(1);
  });

  it('increments success count on upsert', async () => {
    const windowStart = new Date();
    windowStart.setMinutes(0, 0, 0);

    await upsertMetricWindow('fedapay', 'MTN', 'BJ', windowStart, 'SUCCESS', 3000);
    await upsertMetricWindow('fedapay', 'MTN', 'BJ', windowStart, 'SUCCESS', 2000);

    const metrics = await getRecentMetrics('fedapay', 'MTN', 'BJ', 1);
    const window = metrics.find(m => m.windowStart.getTime() === windowStart.getTime());
    expect(window!.successCount).toBeGreaterThanOrEqual(2);
    expect(window!.sampleCount).toBeGreaterThanOrEqual(2);
  });

  it('increments failure count', async () => {
    const windowStart = new Date();
    windowStart.setMinutes(0, 0, 0);
    await upsertMetricWindow('cinetpay', 'Wave', 'SN', windowStart, 'FAILURE');

    const metrics = await getRecentMetrics('cinetpay', 'Wave', 'SN', 1);
    const window = metrics.find(m => m.windowStart.getTime() === windowStart.getTime());
    expect(window!.failureCount).toBeGreaterThanOrEqual(1);
  });
});
