import { getConnection } from '../connection';
import { TransactionEntity, TxStatus } from '../entities/transaction.entity';

export interface CreateTransactionData {
  idempotencyKey: string;
  phone: string;
  amount: number;
  currency: string;
  country: string;
  clientCallbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function createTransaction(data: CreateTransactionData): Promise<TransactionEntity> {
  const repo = getConnection().getRepository(TransactionEntity);
  const tx = repo.create(data);
  return repo.save(tx);
}

export async function findTransactionById(id: string): Promise<TransactionEntity | undefined> {
  return getConnection()
    .getRepository(TransactionEntity)
    .findOne(id, { relations: ['attempts'] });
}

export async function findTransactionByIdempotencyKey(key: string): Promise<TransactionEntity | undefined> {
  return getConnection()
    .getRepository(TransactionEntity)
    .findOne({ where: { idempotencyKey: key }, relations: ['attempts'] });
}

export async function updateTransactionStatus(
  id: string,
  status: TxStatus,
  extra?: Partial<Pick<TransactionEntity, 'operator' | 'settledAt'>>,
): Promise<void> {
  await getConnection()
    .getRepository(TransactionEntity)
    .update(id, { status, ...extra });
}

export async function findTransactionsByPhone(
  phone: string,
  limit = 10,
): Promise<TransactionEntity[]> {
  return getConnection()
    .getRepository(TransactionEntity)
    .find({ where: { phone }, order: { createdAt: 'DESC' }, take: limit });
}
