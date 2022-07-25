import { vi } from 'vitest';

vi.mock('../../../src/db/repositories', () => ({
  findTransactionById: vi.fn(),
  findByPhone:         vi.fn(),
}));
vi.mock('../../../src/db/repositories/attemptRepo', () => ({
  findAttemptsByTransactionId: vi.fn().mockResolvedValue([]),
}));

import Fastify from 'fastify';
import { transactionRoutes } from '../../../src/routes/transactions';
import { findTransactionById, findByPhone } from '../../../src/db/repositories';

const mockFindById    = vi.mocked(findTransactionById);
const mockFindByPhone = vi.mocked(findByPhone);

// Prisma Decimal mock: expose toNumber() so route handler can call tx.amount.toNumber()
const MOCK_TX = {
  id: 'tx-1', phone: '+22997000001', country: 'BJ', operator: 'MTN',
  amount: { toNumber: () => 5000 },
  currency: 'XOF', status: 'INITIATED', webhookUrl: null,
  createdAt: new Date('2021-01-01T00:00:00Z'),
  updatedAt: new Date('2021-01-01T00:00:00Z'),
};

const buildApp = async () => {
  const app = Fastify();
  await app.register(transactionRoutes);
  return app;
};

describe('GET /transactions/:id', () => {
  let app: ReturnType<typeof Fastify>;
  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with tx data', async () => {
    mockFindById.mockResolvedValue(MOCK_TX as any);
    const res = await app.inject({ method: 'GET', url: '/transactions/tx-1' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).country).toBe('BJ');
  });

  it('returns 404 for unknown id', async () => {
    mockFindById.mockResolvedValue(null);
    const res = await app.inject({ method: 'GET', url: '/transactions/nope' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /transactions?phone=', () => {
  let app: ReturnType<typeof Fastify>;
  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => vi.clearAllMocks());

  it('returns transaction list for phone', async () => {
    mockFindByPhone.mockResolvedValue([MOCK_TX] as any);
    const res = await app.inject({ method: 'GET', url: '/transactions?phone=%2B22997000001' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).total).toBe(1);
  });

  it('returns 400 if no phone', async () => {
    const res = await app.inject({ method: 'GET', url: '/transactions' });
    expect(res.statusCode).toBe(400);
  });
});
