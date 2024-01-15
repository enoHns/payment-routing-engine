import {
  createAttempt,
  findAttemptsByTransactionId,
  updateAttempt,
  countAttempts,
} from '../../src/db/repositories/attemptRepo';
import { createTransaction } from '../../src/db/repositories/transactionRepo';
import { connectWithRetry, disconnectPrisma } from '../../src/db/prismaClient';
import { AttemptStatus } from '@prisma/client';

const TEST_DB = process.env.TEST_DATABASE_URL;
const describeIfDb = TEST_DB ? describe : describe.skip;

describeIfDb('attemptRepo (integration)', () => {
  let txId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB!;
    await connectWithRetry();
    const tx = await createTransaction({
      idempotencyKey: `attempt-test-${Date.now()}`,
      phone: '22961999999',
      amount: 5000,
      currency: 'XOF',
      country: 'BJ',
    });
    txId = tx.id;
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('creates an attempt', async () => {
    const attempt = await createAttempt({ transactionId: txId, providerName: 'kkiapay', score: 0.7 });
    expect(attempt.id).toBeDefined();
    expect(attempt.status).toBe(AttemptStatus.PENDING);
  });

  it('finds attempts by transaction id', async () => {
    const attempts = await findAttemptsByTransactionId(txId);
    expect(attempts.length).toBeGreaterThan(0);
  });

  it('updates attempt status', async () => {
    const attempt = await createAttempt({ transactionId: txId, providerName: 'fedapay', score: 0.6 });
    await updateAttempt(attempt.id, { status: AttemptStatus.SUCCESS, latencyMs: 1500 });
    const updated = await findAttemptsByTransactionId(txId);
    const found = updated.find(a => a.id === attempt.id);
    expect(found?.status).toBe(AttemptStatus.SUCCESS);
    expect(found?.latencyMs).toBe(1500);
  });

  it('counts attempts for a transaction', async () => {
    const count = await countAttempts(txId);
    expect(count).toBeGreaterThan(0);
  });
});
