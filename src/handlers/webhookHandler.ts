import { getAdapter } from '../providers/adapterFactory';
import { findAttemptByProviderTxId, updateAttempt } from '../db/repositories/attemptRepo';
import { updateTransactionStatus, findTransactionById } from '../db/repositories/transactionRepo';
import { createAuditLog } from '../db/repositories/auditLogRepo';
import { recordAttemptOutcome } from '../core/metricsUpdater';
import { AttemptStatus, TxStatus } from '@prisma/client';
import logger from '../config/logger';

export interface WebhookProcessResult {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'IGNORED';
}

function isSuccessPayload(p: Record<string, unknown>): boolean {
  const s = String(p.status ?? p.cpm_result ?? '').toLowerCase();
  return s === 'success' || s === 'approved' || s === '00' || s === 'successful' || s === 'completed';
}

// FIXME: this is too generic — each provider adapter should expose its own
// extractProviderTxId(). Works for now since field names don't clash across providers.
function extractProviderTxId(p: Record<string, unknown>): string | undefined {
  return (p.transactionId ?? p.reference ?? p.cpm_trans_id ?? p.hash ?? p.token) as string | undefined;
}

export async function processWebhook(
  providerName: string,
  payload: unknown,
  signature?: string,
): Promise<WebhookProcessResult> {
  const adapter = getAdapter(providerName);

  if (!adapter.verifyWebhook(payload, signature)) {
    logger.warn({ provider: providerName }, 'Invalid webhook signature — ignored');
    return { transactionId: '', status: 'IGNORED' };
  }

  const p = payload as Record<string, unknown>;
  const providerTxId = extractProviderTxId(p);

  if (!providerTxId) {
    logger.warn({ provider: providerName }, 'Cannot extract providerTxId');
    return { transactionId: '', status: 'IGNORED' };
  }

  const attempt = await findAttemptByProviderTxId(providerTxId);
  if (!attempt) {
    logger.warn({ provider: providerName, providerTxId }, 'No attempt found for providerTxId');
    return { transactionId: '', status: 'IGNORED' };
  }

  const tx = await findTransactionById(attempt.transactionId);
  const resolvedAt = new Date();
  const success    = isSuccessPayload(p);
  const latencyMs  = resolvedAt.getTime() - new Date(attempt.createdAt).getTime();

  await updateAttempt(attempt.id, {
    status:         success ? AttemptStatus.SUCCESS : AttemptStatus.FAILED,
    webhookPayload: p,
    resolvedAt,
    latencyMs,
  });

  await updateTransactionStatus(
    attempt.transactionId,
    success ? TxStatus.SUCCESS : TxStatus.FAILED,
    success ? { settledAt: resolvedAt } : undefined,
  );

  await createAuditLog({
    transactionId: attempt.transactionId,
    event:         success ? 'WEBHOOK_SUCCESS' : 'WEBHOOK_FAILURE',
    payload:       p,
  });

  if (tx?.operator) {
    await recordAttemptOutcome(providerName, tx.operator, tx.country, success, latencyMs);
  }

  logger.info({ transactionId: attempt.transactionId, provider: providerName, success }, 'Webhook processed');
  return { transactionId: attempt.transactionId, status: success ? 'SUCCESS' : 'FAILED' };
}
