import { getConnection } from '../connection';
import { AuditLogEntity } from '../entities/auditLog.entity';

export interface CreateAuditLogData {
  transactionId: string;
  event: string;
  payload?: Record<string, unknown>;
}

export async function createAuditLog(data: CreateAuditLogData): Promise<AuditLogEntity> {
  const repo = getConnection().getRepository(AuditLogEntity);
  const log = repo.create(data);
  return repo.save(log);
}

export async function findAuditLogsByTransactionId(transactionId: string): Promise<AuditLogEntity[]> {
  return getConnection()
    .getRepository(AuditLogEntity)
    .find({ where: { transactionId }, order: { createdAt: 'ASC' } });
}
