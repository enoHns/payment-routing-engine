import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/core/providerRegistry', () => ({
  getEligibleProviders: vi.fn(),
}));
vi.mock('../../../src/core/metricsAggregator', () => ({
  getRecentProviderStats: vi.fn().mockResolvedValue({
    successCount: 5, failureCount: 1, totalLatencyMs: 5000, sampleCount: 5,
  }),
}));
vi.mock('../../../src/core/scoreCache', () => ({
  getCachedScore: vi.fn().mockResolvedValue(null),
  setCachedScore: vi.fn().mockResolvedValue(undefined),
}));

import { rankProviders, selectBestProvider } from '../../../src/core/routingEngine';
import { getEligibleProviders } from '../../../src/core/providerRegistry';

const mockEligible = getEligibleProviders as ReturnType<typeof vi.fn>;

const P1 = { name: 'kkiapay', priority: 1, active: true, supportedCountries: ['BJ'], displayName: 'Kkiapay', supportedOperators: {} };
const P2 = { name: 'fedapay', priority: 2, active: true, supportedCountries: ['BJ'], displayName: 'Fedapay', supportedOperators: {} };

describe('rankProviders', () => {
  beforeEach(() => { mockEligible.mockReturnValue([P1, P2]); });

  it('returns ranked providers', async () => {
    const ranked = await rankProviders('MTN', 'BJ');
    expect(ranked).toHaveLength(2);
  });

  it('returns empty for no eligible providers', async () => {
    mockEligible.mockReturnValue([]);
    const ranked = await rankProviders('Wave', 'BJ');
    expect(ranked).toHaveLength(0);
  });
});

describe('selectBestProvider', () => {
  it('returns first item', () => {
    const result = selectBestProvider([{ provider: P1, score: 0.9, fromCache: false }] as any);
    expect(result?.provider.name).toBe('kkiapay');
  });
  it('returns null for empty array', () => {
    expect(selectBestProvider([])).toBeNull();
  });
});
