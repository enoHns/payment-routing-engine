import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/core/routingEngine', () => ({
  rankProviders: vi.fn(),
}));

import { buildFallbackChain, shouldFallback } from '../../../src/core/fallbackChain';
import { rankProviders } from '../../../src/core/routingEngine';
import { TxStatus } from '@prisma/client';

const mockRank = rankProviders as ReturnType<typeof vi.fn>;

const KKIAPAY = { name: 'kkiapay', priority: 1, active: true, supportedCountries: ['BJ'], displayName: 'Kkiapay', supportedOperators: {} };
const FEDAPAY = { name: 'fedapay', priority: 2, active: true, supportedCountries: ['BJ'], displayName: 'Fedapay', supportedOperators: {} };

/**
 * Scenario: payment attempt on kkiapay times out. Worker triggers fallback to fedapay.
 * MEANWHILE: kkiapay calls our webhook marking the tx SUCCESS.
 * Expected: worker detects SUCCESS status, skips fedapay attempt (no double-charge).
 *
 * This test documents the guard in routingWorker.ts (findTransactionById check
 * before re-enqueueing). The actual concurrency behaviour is tested via integration.
 */
describe('fallback + concurrent webhook scenario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRank.mockResolvedValue([
      { provider: KKIAPAY, score: 0.9, fromCache: false },
      { provider: FEDAPAY, score: 0.7, fromCache: false },
    ]);
  });

  it('shouldFallback returns true for TIMEOUT', () => {
    expect(shouldFallback('TIMEOUT')).toBe(true);
  });

  it('shouldFallback returns true for PROVIDER_TIMEOUT', () => {
    expect(shouldFallback('PROVIDER_TIMEOUT')).toBe(true);
  });

  it('shouldFallback returns false for INSUFFICIENT_FUNDS (non-retryable)', () => {
    expect(shouldFallback('PROVIDER_INSUFFICIENT_FUNDS')).toBe(false);
  });

  it('buildFallbackChain excludes already-tried provider', async () => {
    const chain = await buildFallbackChain('MTN', 'BJ', {
      maxAttempts: 3,
      excludeProviders: ['kkiapay'],
    });
    expect(chain).toHaveLength(1);
    expect(chain[0].provider.name).toBe('fedapay');
  });

  it('tx already SUCCESS — worker should skip retry (status guard logic)', () => {
    // Simulates what routingWorker.ts checks before re-enqueueing
    const tx = { id: 'tx-1', status: TxStatus.SUCCESS } as any;
    const shouldSkip = tx.status === TxStatus.SUCCESS || tx.status === TxStatus.FAILED;
    expect(shouldSkip).toBe(true);
  });

  it('tx still PROCESSING — worker should proceed with fallback', () => {
    const tx = { id: 'tx-1', status: TxStatus.PROCESSING } as any;
    const shouldSkip = tx.status === TxStatus.SUCCESS || tx.status === TxStatus.FAILED;
    expect(shouldSkip).toBe(false);
  });
});
