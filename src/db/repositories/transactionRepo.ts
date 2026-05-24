import { TxStatus, Transaction } from '@prisma/client';
import { getPrismaClient } from '../prismaClient';

export interface CreateTransactionData {
  phone:            string;
  country:          string;
  operator?:        string;
  amount:           number;
  currency:         string;
  idempotencyKey?:  string;
  webhookUrl?:      string;
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

export async function updateTransactionStatus(
  id: string,
  status: TxStatus,
  extra?: Partial<Pick<Transaction, 'operator' | 'settledAt' | 'checkoutUrl'>>,
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
