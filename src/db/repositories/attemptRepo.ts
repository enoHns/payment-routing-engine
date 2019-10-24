import { getConnection } from '../connection';
import { AttemptEntity, AttemptStatus } from '../entities/attempt.entity';

export interface CreateAttemptData {
  transactionId: string;
  providerName: string;
  score: number;
}

export async function createAttempt(data: CreateAttemptData): Promise<AttemptEntity> {
  const repo = getConnection().getRepository(AttemptEntity);
  const attempt = repo.create(data);
  return repo.save(attempt);
}

export async function updateAttempt(
  id: string,
  data: Partial<Pick<AttemptEntity, 'status' | 'providerTxId' | 'latencyMs' | 'errorCode' | 'errorMessage' | 'webhookPayload' | 'resolvedAt'>>,
): Promise<void> {
  await getConnection().getRepository(AttemptEntity).update(id, data);
}

export async function findAttemptByProviderTxId(providerTxId: string): Promise<AttemptEntity | undefined> {
  return getConnection()
    .getRepository(AttemptEntity)
    .findOne({ where: { providerTxId } });
}

export async function findAttemptsByTransactionId(transactionId: string): Promise<AttemptEntity[]> {
  return getConnection()
    .getRepository(AttemptEntity)
    .find({ where: { transactionId }, order: { createdAt: 'ASC' } });
}

export async function countAttempts(transactionId: string): Promise<number> {
  return getConnection()
    .getRepository(AttemptEntity)
    .count({ where: { transactionId } });
}
