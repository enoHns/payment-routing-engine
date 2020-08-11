jest.mock('../../../src/core/routingEngine', () => ({
  rankProviders: jest.fn(),
}));
jest.mock('../../../src/core/scoreCache', () => ({
  getCachedScore: jest.fn().mockResolvedValue(null),
  setCachedScore: jest.fn(),
}));

import { buildFallbackChain, shouldFallback } from '../../../src/core/fallbackChain';
import { rankProviders } from '../../../src/core/routingEngine';

const mockRank = rankProviders as jest.MockedFunction<typeof rankProviders>;

const PROVIDERS = [
  { provider: { name: 'kkiapay', priority: 1 } as any, score: 0.9 },
  { provider: { name: 'fedapay', priority: 2 } as any, score: 0.7 },
  { provider: { name: 'feexpay', priority: 2 } as any, score: 0.6 },
];

describe('buildFallbackChain', () => {
  beforeEach(() => { mockRank.mockResolvedValue(PROVIDERS); });

  it('returns maxAttempts providers', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', { maxAttempts: 2 });
    expect(chain).toHaveLength(2);
  });

  it('excludes specified providers', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', {
      maxAttempts: 3,
      excludeProviders: ['kkiapay'],
    });
    expect(chain.map(sp => sp.provider.name)).not.toContain('kkiapay');
  });

  it('returns all providers up to maxAttempts', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', { maxAttempts: 10 });
    expect(chain).toHaveLength(PROVIDERS.length);
  });
});

describe('shouldFallback', () => {
  it('returns true for TIMEOUT', () => {
    expect(shouldFallback('PROVIDER_TIMEOUT')).toBe(true);
  });
  it('returns true for NETWORK_ERROR', () => {
    expect(shouldFallback('PROVIDER_NETWORK_ERROR')).toBe(true);
  });
  it('returns false for INSUFFICIENT_FUNDS', () => {
    expect(shouldFallback('PROVIDER_INSUFFICIENT_FUNDS')).toBe(false);
  });
  it('returns false for DUPLICATE', () => {
    expect(shouldFallback('PROVIDER_DUPLICATE_TRANSACTION')).toBe(false);
  });
});
