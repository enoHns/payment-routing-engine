import { vi } from 'vitest';

vi.mock('../../../src/db/repositories/metricsRepo', () => ({
  getRecentMetrics: vi.fn(),
}));

import { aggregateProviderStats } from '../../../src/core/metricsAggregator';
import { getRecentMetrics } from '../../../src/db/repositories/metricsRepo';

const mockGetRecentMetrics = getRecentMetrics as ReturnType<typeof vi.fn>;

describe('aggregateProviderStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns neutral cold start when no data', async () => {
    mockGetRecentMetrics.mockResolvedValue([]);
    const stats = await aggregateProviderStats('kkiapay', 'MTN', 'BJ');
    expect(stats.successCount).toBe(0);
    expect(stats.sampleCount).toBe(0);
  });

  it('aggregates multiple windows', async () => {
    mockGetRecentMetrics.mockResolvedValue([
      { successCount: 10, failureCount: 2, totalLatencyMs: BigInt(15000), sampleCount: 12 } as any,
      { successCount: 5,  failureCount: 1, totalLatencyMs: BigInt(7500),  sampleCount: 6  } as any,
    ]);
    const stats = await aggregateProviderStats('kkiapay', 'MTN', 'BJ');
    expect(stats.successCount).toBe(15);
    expect(stats.failureCount).toBe(3);
    expect(stats.sampleCount).toBe(18);
  });

  it('converts BigInt totalLatencyMs to number', async () => {
    mockGetRecentMetrics.mockResolvedValue([
      { successCount: 1, failureCount: 0, totalLatencyMs: BigInt(3000), sampleCount: 1 } as any,
    ]);
    const stats = await aggregateProviderStats('kkiapay', 'MTN', 'BJ');
    expect(typeof stats.totalLatencyMs).toBe('number');
    expect(stats.totalLatencyMs).toBe(3000);
  });
});
