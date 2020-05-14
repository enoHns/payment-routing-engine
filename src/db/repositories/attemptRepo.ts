import { AttemptStatus, Attempt } from '@prisma/client';
import { getPrismaClient } from '../prismaClient';

export interface CreateAttemptData {
  transactionId: string;
  providerName:  string;
  score:         number;
}

export async function createAttempt(data: CreateAttemptData): Promise<Attempt> {
  return getPrismaClient().attempt.create({ data });
}

export async function updateAttempt(
  id: string,
  data: Partial<Pick<Attempt, 'status' | 'providerTxId' | 'latencyMs' | 'errorCode' | 'errorMessage' | 'webhookPayload' | 'resolvedAt'>>,
): Promise<void> {
  await getPrismaClient().attempt.update({ where: { id }, data });
}

export async function findAttemptByProviderTxId(providerTxId: string): Promise<Attempt | null> {
  return getPrismaClient().attempt.findFirst({ where: { providerTxId } });
}

export async function findAttemptsByTransactionId(transactionId: string): Promise<Attempt[]> {
  return getPrismaClient().attempt.findMany({ where: { transactionId }, orderBy: { createdAt: 'asc' } });
}

export async function countAttempts(transactionId: string): Promise<number> {
  return getPrismaClient().attempt.count({ where: { transactionId } });
}
