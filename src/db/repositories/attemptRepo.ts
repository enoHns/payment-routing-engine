import { prisma } from '../prismaClient';
import { AttemptStatus } from '@prisma/client';

interface CreateAttemptData {
  transactionId: string;
  providerName:  string;
  score?:        number;
}

interface UpdateAttemptData {
  status?:         AttemptStatus;
  providerTxId?:   string;
  latencyMs?:      number;
  errorCode?:      string;
  errorMessage?:   string;
  resolvedAt?:     Date;
  webhookPayload?: Record<string, unknown>;
}

export async function createAttempt(data: CreateAttemptData) {
  return prisma.attempt.create({ data });
}

export async function updateAttempt(id: string, data: UpdateAttemptData) {
  return prisma.attempt.update({ where: { id }, data: data as any });
}

export async function findAttemptByProviderTxId(providerTxId: string) {
  return prisma.attempt.findFirst({ where: { providerTxId } });
}

export async function findByTransactionId(transactionId: string) {
  return prisma.attempt.findMany({
    where:   { transactionId },
    orderBy: { createdAt: 'asc' },
  });
}

/** Alias used by route handlers */
export const findAttemptsByTransactionId = findByTransactionId;

export async function countAttempts(transactionId: string): Promise<number> {
  return prisma.attempt.count({ where: { transactionId } });
}
