jest.mock('../../../src/core/metricsAggregator', () => ({
  aggregateProviderStats: jest.fn(),
}));
jest.mock('../../../src/core/scoreCache', () => ({
  getCachedScore: jest.fn().mockResolvedValue(null),
  setCachedScore: jest.fn().mockResolvedValue(undefined),
}));

import { rankProviders, selectBestProvider } from '../../../src/core/routingEngine';
import { aggregateProviderStats } from '../../../src/core/metricsAggregator';

const mockAgg = aggregateProviderStats as jest.MockedFunction<typeof aggregateProviderStats>;

const GOOD_STATS = { successCount: 90, failureCount: 10, totalLatencyMs: 20000, sampleCount: 100 };
const POOR_STATS = { successCount: 30, failureCount: 70, totalLatencyMs: 80000, sampleCount: 100 };

describe('rankProviders — BJ/MTN', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // kkiapay has priority 1 — good stats; fedapay priority 2 — poor stats
    mockAgg.mockImplementation(async (provider) => {
      if (provider === 'kkiapay') return GOOD_STATS;
      if (provider === 'fedapay') return POOR_STATS;
      return { successCount: 0, failureCount: 0, totalLatencyMs: 0, sampleCount: 0 };
    });
  });

  it('returns at least one provider', async () => {
    const ranked = await rankProviders('MTN', 'BJ');
    expect(ranked.length).toBeGreaterThan(0);
  });

  it('highest score is first', async () => {
    const ranked = await rankProviders('MTN', 'BJ');
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it('kkiapay ranked above fedapay given better stats + priority', async () => {
    const ranked = await rankProviders('MTN', 'BJ');
    const names = ranked.map(r => r.provider.name);
    expect(names.indexOf('kkiapay')).toBeLessThan(names.indexOf('fedapay'));
  });

  it('throws for unsupported operator/country', async () => {
    await expect(rankProviders('Wave', 'BJ')).rejects.toThrow('No eligible providers');
  });
});

describe('selectBestProvider', () => {
  it('returns the top-ranked provider', async () => {
    mockAgg.mockResolvedValue(GOOD_STATS);
    const best = await selectBestProvider('MTN', 'BJ');
    expect(best.provider.name).toBeDefined();
    expect(best.score).toBeGreaterThan(0);
  });
});
