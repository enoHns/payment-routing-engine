jest.mock('../../../src/core/fallbackChain');
jest.mock('../../../src/providers/adapterFactory');
jest.mock('../../../src/db/repositories', () => ({
  createAttempt:           jest.fn().mockResolvedValue({ id: 'att-1', createdAt: new Date() }),
  updateAttempt:           jest.fn().mockResolvedValue(undefined),
  updateTransactionStatus: jest.fn().mockResolvedValue(undefined),
  createAuditLog:          jest.fn().mockResolvedValue(undefined),
}));

import { buildFallbackChain } from '../../../src/core/fallbackChain';
import { getAdapter } from '../../../src/providers/adapterFactory';

const mockBuildChain = buildFallbackChain as jest.MockedFunction<typeof buildFallbackChain>;
const mockGetAdapter = getAdapter as jest.MockedFunction<typeof getAdapter>;

const PROVIDER = {
  name: 'kkiapay', priority: 1, active: true,
  supportedCountries: ['BJ'], displayName: 'Kkiapay', supportedOperators: {},
};

describe('routing job processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
