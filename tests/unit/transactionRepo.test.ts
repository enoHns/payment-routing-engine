// Unit tests for transactionRepo
// Note: these tests require a running PostgreSQL instance
// Use TEST_DATABASE_URL env variable to point to a test DB

import {
  createTransaction,
  findTransactionById,
  findTransactionByIdempotencyKey,
  updateTransactionStatus,
} from '../../src/db/repositories/transactionRepo';
import { connectDatabase, disconnectDatabase } from '../../src/db/connection';
import { TxStatus } from '../../src/db/entities/transaction.entity';

const TEST_DB = process.env.TEST_DATABASE_URL;

// Skip tests if no test DB configured
const describeIfDb = TEST_DB ? describe : describe.skip;

describeIfDb('transactionRepo', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB!;
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('creates a transaction', async () => {
    const tx = await createTransaction({
      idempotencyKey: `test-${Date.now()}`,
      phone: '22961000000',
      amount: 5000,
      currency: 'XOF',
      country: 'BJ',
    });

    expect(tx.id).toBeDefined();
    expect(tx.status).toBe(TxStatus.INITIATED);
    expect(tx.amount).toBe(5000);
  });

  it('finds transaction by id', async () => {
    const created = await createTransaction({
      idempotencyKey: `test-find-${Date.now()}`,
      phone: '22961000001',
      amount: 1000,
      currency: 'XOF',
      country: 'BJ',
    });

    const found = await findTransactionById(created.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
  });

  it('finds transaction by idempotency key', async () => {
    const key = `idem-${Date.now()}`;
    await createTransaction({
      idempotencyKey: key,
      phone: '22961000002',
      amount: 2000,
      currency: 'XOF',
      country: 'BJ',
    });

    const found = await findTransactionByIdempotencyKey(key);
    expect(found).toBeDefined();
    expect(found!.idempotencyKey).toBe(key);
  });

  it('returns undefined for unknown idempotency key', async () => {
    const found = await findTransactionByIdempotencyKey('does-not-exist');
    expect(found).toBeUndefined();
  });

  it('updates transaction status', async () => {
    const tx = await createTransaction({
      idempotencyKey: `test-update-${Date.now()}`,
      phone: '22961000003',
      amount: 3000,
      currency: 'XOF',
      country: 'BJ',
    });

    await updateTransactionStatus(tx.id, TxStatus.PROCESSING);
    const updated = await findTransactionById(tx.id);
    expect(updated!.status).toBe(TxStatus.PROCESSING);
  });
});
