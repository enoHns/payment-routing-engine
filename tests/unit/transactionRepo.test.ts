import { createTransaction, findTransactionById, updateTransactionStatus } from '../../src/db/repositories/transactionRepo';
import { TxStatus } from '@prisma/client';

const mockPrisma = {
  transaction: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    update:     jest.fn(),
    findMany:   jest.fn(),
  },
};

jest.mock('../../src/db/prismaClient', () => ({
  getPrismaClient: () => mockPrisma,
}));

describe('transactionRepo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a transaction', async () => {
    const data = { idempotencyKey: 'k1', phone: '96123456', amount: 5000, currency: 'XOF', country: 'BJ' };
    mockPrisma.transaction.create.mockResolvedValue({ id: 'uuid-1', ...data, status: 'INITIATED' });
    const tx = await createTransaction(data);
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith({ data });
    expect(tx.id).toBe('uuid-1');
  });

  it('finds transaction by id', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({ id: 'uuid-1', attempts: [] });
    const tx = await findTransactionById('uuid-1');
    expect(tx).not.toBeNull();
    expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid-1' }, include: { attempts: true } });
  });

  it('returns null for unknown id', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);
    expect(await findTransactionById('no-such-id')).toBeNull();
  });

  it('updates transaction status', async () => {
    mockPrisma.transaction.update.mockResolvedValue({});
    await updateTransactionStatus('uuid-1', TxStatus.PROCESSING);
    expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      data:  { status: TxStatus.PROCESSING },
    });
  });
});
