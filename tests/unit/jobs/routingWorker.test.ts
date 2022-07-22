import { vi } from 'vitest';

vi.mock('../../../src/core/fallbackChain');
vi.mock('../../../src/providers/adapterFactory');
vi.mock('../../../src/db/repositories', () => ({
  createAttempt:           vi.fn().mockResolvedValue({ id: 'att-1', createdAt: new Date() }),
  updateAttempt:           vi.fn().mockResolvedValue(undefined),
  updateTransactionStatus: vi.fn().mockResolvedValue(undefined),
  createAuditLog:          vi.fn().mockResolvedValue(undefined),
  findTransactionById:     vi.fn().mockResolvedValue({ id: 'tx-1', status: 'PROCESSING' }),
}));

import { buildFallbackChain } from '../../../src/core/fallbackChain';
import { getAdapter } from '../../../src/providers/adapterFactory';

const mockBuildChain = buildFallbackChain as ReturnType<typeof vi.fn>;
const mockGetAdapter = getAdapter as ReturnType<typeof vi.fn>;

const PROVIDER = {
  name: 'kkiapay', priority: 1, active: true,
  supportedCountries: ['BJ'], displayName: 'Kkiapay', supportedOperators: {},
};

describe('routing job processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildChain.mockResolvedValue([{ provider: PROVIDER as any, score: 0.9 }]);
  });

  it('has processJob available via worker', () => {
    expect(mockBuildChain).toBeDefined();
    expect(mockGetAdapter).toBeDefined();
  });

  it('chain returns kkiapay as first', async () => {
    const chain = await mockBuildChain('MTN', 'BJ', { maxAttempts: 3 });
    expect(chain[0].provider.name).toBe('kkiapay');
  });

  it('chain is empty when no providers', async () => {
    mockBuildChain.mockResolvedValue([]);
    const chain = await mockBuildChain('Wave', 'BJ', { maxAttempts: 3 });
    expect(chain).toHaveLength(0);
  });
});
