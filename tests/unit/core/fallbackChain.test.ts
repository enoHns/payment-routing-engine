jest.mock('../../../src/core/routingEngine', () => ({
  rankProviders: jest.fn(),
}));

import { buildFallbackChain, shouldFallback } from '../../../src/core/fallbackChain';
import { rankProviders } from '../../../src/core/routingEngine';

const mockRank = rankProviders as jest.MockedFunction<typeof rankProviders>;
const make = (name: string, priority: number, score: number) => ({
  provider: { name, priority, active: true, supportedCountries: ['BJ'], displayName: name, supportedOperators: {} },
  score, fromCache: false,
});

describe('buildFallbackChain', () => {
  beforeEach(() => {
    mockRank.mockResolvedValue([
      make('kkiapay', 1, 0.9), make('fedapay', 2, 0.7), make('feexpay', 3, 0.6),
    ] as any);
  });

  it('returns all providers up to maxAttempts', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', { maxAttempts: 3 });
    expect(chain).toHaveLength(3);
    expect(chain[0].provider.name).toBe('kkiapay');
  });

  it('excludes specified providers', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', {
      maxAttempts: 3, excludeProviders: ['kkiapay'],
    });
    expect(chain[0].provider.name).toBe('fedapay');
    expect(chain).toHaveLength(2);
  });

  it('respects maxAttempts', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', { maxAttempts: 2 });
    expect(chain).toHaveLength(2);
  });

  it('returns empty when all excluded', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', {
      maxAttempts: 3, excludeProviders: ['kkiapay', 'fedapay', 'feexpay'],
    });
    expect(chain).toHaveLength(0);
  });
});

describe('shouldFallback', () => {
  it('returns true for TIMEOUT', () => { expect(shouldFallback('TIMEOUT')).toBe(true); });
  it('returns true for NETWORK', () => { expect(shouldFallback('NETWORK_ERROR')).toBe(true); });
  it('returns false for non-retryable', () => { expect(shouldFallback('UNKNOWN')).toBe(false); });
});
