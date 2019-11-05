import {
  createAttempt,
  findAttemptsByTransactionId,
  updateAttempt,
  countAttempts,
} from '../../src/db/repositories/attemptRepo';
import { createTransaction } from '../../src/db/repositories/transactionRepo';
import { connectDatabase, disconnectDatabase } from '../../src/db/connection';
import { AttemptStatus } from '../../src/db/entities/attempt.entity';

const TEST_DB = process.env.TEST_DATABASE_URL;
const describeIfDb = TEST_DB ? describe : describe.skip;

describeIfDb('attemptRepo', () => {
  let txId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB!;
    await connectDatabase();
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
    await disconnectDatabase();
  });

  it('creates an attempt', async () => {
    const attempt = await createAttempt({ transactionId: txId, providerName: 'kkiapay', score: 0.7 });
    expect(attempt.id).toBeDefined();
    expect(attempt.status).toBe(AttemptStatus.PENDING);
  });

  it('finds attempts by transaction id', async () => {
    const attempts = await findAttemptsByTransactionId(txId);
    expect(attempts.length).toBeGreaterThan(0);
    expect(attempts[0].transactionId).toBe(txId);
  });

  it('updates attempt status', async () => {
    const attempt = await createAttempt({ transactionId: txId, providerName: 'fedapay', score: 0.65 });
    await updateAttempt(attempt.id, { status: AttemptStatus.SUCCESS, latencyMs: 3200 });

    const found = (await findAttemptsByTransactionId(txId)).find(a => a.id === attempt.id);
    expect(found!.status).toBe(AttemptStatus.SUCCESS);
    expect(found!.latencyMs).toBe(3200);
  });

  it('counts attempts for a transaction', async () => {
    const count = await countAttempts(txId);
    expect(count).toBeGreaterThan(0);
  });
});
