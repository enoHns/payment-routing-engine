import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/core/routingEngine', () => ({
  rankProviders: vi.fn(),
}));

import { buildFallbackChain, shouldFallback } from '../../../src/core/fallbackChain';
import { rankProviders } from '../../../src/core/routingEngine';

const mockRank = rankProviders as ReturnType<typeof vi.fn>;
const make = (name: string, priority: number, score: number) => ({
  provider: { name, priority, active: true, supportedCountries: ['BJ'], displayName: name, supportedOperators: {} },
  score, fromCache: false,
});

describe('buildFallbackChain', () => {
  beforeEach(() => {
    mockRank.mockResolvedValue([make('kkiapay', 1, 0.9), make('fedapay', 2, 0.7), make('feexpay', 3, 0.6)]);
  });

  it('filters excludeProviders', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', { maxAttempts: 3, excludeProviders: ['kkiapay'] });
    expect(chain[0].provider.name).toBe('fedapay');
  });

  it('respects maxAttempts', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', { maxAttempts: 2 });
    expect(chain).toHaveLength(2);
  });
});

describe('shouldFallback', () => {
  it('true for TIMEOUT', () => expect(shouldFallback('TIMEOUT')).toBe(true));
  it('false for non-retryable', () => expect(shouldFallback('UNKNOWN')).toBe(false));
});
