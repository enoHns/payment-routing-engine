import { vi } from 'vitest';
import { createTransaction, findTransactionById, updateTransactionStatus } from '../../src/db/repositories/transactionRepo';
import { TxStatus } from '@prisma/client';

const mockPrisma = {
  transaction: {
    create:     vi.fn(),
    findUnique: vi.fn(),
    update:     vi.fn(),
    updateMany: vi.fn(),
    findMany:   vi.fn(),
  },
};

vi.mock('../../src/db/prismaClient', () => ({
  getPrismaClient: () => mockPrisma,
}));

describe('transactionRepo', () => {
  beforeEach(() => vi.clearAllMocks());

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

  it('skips update when transaction is already in terminal state', async () => {
    // updateMany returns { count: 0 } when the WHERE guard excludes the row
    mockPrisma.transaction.updateMany.mockResolvedValue({ count: 0 });
    await updateTransactionStatus('uuid-1', TxStatus.PROCESSING);
    expect(mockPrisma.transaction.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'uuid-1',
        status: { notIn: [TxStatus.SUCCESS, TxStatus.FAILED, TxStatus.REFUNDED] },
      },
      data: { status: TxStatus.PROCESSING },
    });
  });

  it('updates status when not in terminal state', async () => {
    mockPrisma.transaction.updateMany.mockResolvedValue({ count: 1 });
    await updateTransactionStatus('uuid-1', TxStatus.SUCCESS, { settledAt: expect.any(Date) as any });
    expect(mockPrisma.transaction.updateMany).toHaveBeenCalled();
  });
});
