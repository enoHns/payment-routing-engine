jest.mock('../../../src/db/repositories/transactionRepo', () => ({
  findTransactionById: jest.fn(),
}));
jest.mock('../../../src/db/repositories/attemptRepo', () => ({
  findAttemptsByTransactionId: jest.fn().mockResolvedValue([]),
}));

import Fastify from 'fastify';
import { transactionRoutes } from '../../../src/routes/transactions';
import { findTransactionById } from '../../../src/db/repositories/transactionRepo';

const mockFind = findTransactionById as jest.MockedFunction<typeof findTransactionById>;

const MOCK_TX = {
  id:        'tx-1',
  phone:     '+22997000001',
  country:   'BJ',
  operator:  'MTN',
  amount:    5000,
  currency:  'XOF',
  status:    'INITIATED',
  webhookUrl: null,
  createdAt: new Date('2020-12-01T00:00:00Z'),
  updatedAt: new Date('2020-12-01T00:00:00Z'),
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
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with transaction', async () => {
    mockFind.mockResolvedValue(MOCK_TX as any);
    const res = await app.inject({ method: 'GET', url: '/transactions/tx-1' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe('tx-1');
    expect(body.country).toBe('BJ');
  });

  it('returns 404 when not found', async () => {
    mockFind.mockResolvedValue(null);
    const res = await app.inject({ method: 'GET', url: '/transactions/unknown' });
    expect(res.statusCode).toBe(404);
  });
});
