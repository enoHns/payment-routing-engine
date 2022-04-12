import { TxStatus, Transaction } from '@prisma/client';
import { getPrismaClient } from '../prismaClient';

export interface CreateTransactionData {
  idempotencyKey:    string;
  phone:             string;
  amount:            number;
  currency:          string;
  country:           string;
  clientCallbackUrl?: string;
  metadata?:         Record<string, unknown>;
}

export async function createTransaction(data: CreateTransactionData): Promise<Transaction> {
  return getPrismaClient().transaction.create({ data });
}

export async function findTransactionById(id: string): Promise<Transaction | null> {
  return getPrismaClient().transaction.findUnique({ where: { id }, include: { attempts: true } });
}

export async function findTransactionByIdempotencyKey(key: string): Promise<Transaction | null> {
  return getPrismaClient().transaction.findUnique({
    where: { idempotencyKey: key },
    include: { attempts: true },
  });
}

/**
 * Update transaction status, guarding against overwriting terminal states.
 * Uses updateMany so the call is a no-op (not an error) when the transaction
 * is already SUCCESS / FAILED / REFUNDED — prevents double-charge in concurrent
 * webhook + fallback scenarios.
 */
export async function updateTransactionStatus(
  id: string,
  status: TxStatus,
  extra?: Partial<Pick<Transaction, 'operator' | 'settledAt'>>,
): Promise<void> {
  await getPrismaClient().transaction.updateMany({
    where: {
      id,
      status: { notIn: [TxStatus.SUCCESS, TxStatus.FAILED, TxStatus.REFUNDED] },
    },
    data: { status, ...extra },
  });
}

export async function findTransactionsByPhone(phone: string, take = 10): Promise<Transaction[]> {
  return getPrismaClient().transaction.findMany({
    where: { phone },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
