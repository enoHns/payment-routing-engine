import { AuditLog } from '@prisma/client';
import { getPrismaClient } from '../prismaClient';

export interface CreateAuditLogData {
  transactionId: string;
  event:         string;
  payload?:      Record<string, unknown>;
}

export async function createAuditLog(data: CreateAuditLogData): Promise<AuditLog> {
  return getPrismaClient().auditLog.create({ data: data as any });
}

export async function findAuditLogsByTransactionId(transactionId: string): Promise<AuditLog[]> {
  return getPrismaClient().auditLog.findMany({ where: { transactionId }, orderBy: { createdAt: 'asc' } });
}
