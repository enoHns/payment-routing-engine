import { Worker, Job } from 'bullmq';
import { RoutingJobPayload, enqueueRoutingJob } from './routingQueue';
import { buildFallbackChain, shouldFallback, logFallback } from '../core/fallbackChain';
import { getAdapter } from '../providers/adapterFactory';
import { normalizeProviderError } from '../utils/httpError';
import {
  createAttempt,
  updateAttempt,
  updateTransactionStatus,
  findTransactionById,
  createAuditLog,
} from '../db/repositories';
import { AttemptStatus, TxStatus } from '@prisma/client';
import { env } from '../config/env';
import logger from '../config/logger';

const QUEUE_NAME  = 'routing';
const CONCURRENCY = 3;

function parseRedisUrl(url: string) {
  const u = new URL(url);
  return { host: u.hostname, port: parseInt(u.port || '6379', 10) };
}

async function processJob(job: Job<RoutingJobPayload>): Promise<void> {
  const { transactionId, operator, country, phone, amount, currency, webhookUrl, excludeProviders } = job.data;
  logger.info({ transactionId, jobId: job.id }, 'Processing routing job');

  const chain = await buildFallbackChain(operator, country, {
    maxAttempts:      env.MAX_FALLBACK_ATTEMPTS ?? 3,
    excludeProviders,
  });

  if (chain.length === 0) {
    await updateTransactionStatus(transactionId, TxStatus.FAILED);
    await createAuditLog({ transactionId, event: 'NO_ELIGIBLE_PROVIDER', payload: { operator, country } });
    return;
  }

  const { provider, score } = chain[0];
  const adapter = getAdapter(provider.name);

  await updateTransactionStatus(transactionId, TxStatus.PROVIDER_SELECTED, { operator });
  const attempt = await createAttempt({ transactionId, providerName: provider.name, score });
  await createAuditLog({ transactionId, event: 'PROVIDER_SELECTED', payload: { provider: provider.name, score } });

  const startedAt = Date.now();
  await updateTransactionStatus(transactionId, TxStatus.PROCESSING);

  try {
    const response = await adapter.initiatePayment({
      transactionId, phone, amount, currency, country, operator, webhookUrl,
    });
    await updateAttempt(attempt.id, {
      providerTxId: response.providerTxId,
      status:       AttemptStatus.PENDING,
      latencyMs:    Date.now() - startedAt,
    });
    await createAuditLog({
      transactionId, event: 'PAYMENT_INITIATED',
      payload: { provider: provider.name, providerTxId: response.providerTxId },
    });
    logger.info({ transactionId, provider: provider.name, providerTxId: response.providerTxId }, 'Payment initiated');
  } catch (rawErr) {
    const err       = normalizeProviderError(rawErr);
    const latencyMs = Date.now() - startedAt;
    await updateAttempt(attempt.id, {
      status: AttemptStatus.FAILED, latencyMs, errorCode: err.code,
      errorMessage: err.message, resolvedAt: new Date(),
    });
    await createAuditLog({ transactionId, event: 'PROVIDER_ERROR', payload: { provider: provider.name, ...err } });

    if (shouldFallback(err.code) && chain.length > 1) {
      // Guard: check if a concurrent webhook already resolved the transaction.
      // Without this check, a successful webhook + our retry = potential double-charge.
      const currentTx = await findTransactionById(transactionId);
      if (currentTx && (currentTx.status === TxStatus.SUCCESS || currentTx.status === TxStatus.FAILED)) {
        logger.info({ transactionId, status: currentTx.status }, 'Transaction already resolved — skipping fallback retry');
        return;
      }

      const nextProvider = chain[1].provider.name;
      logFallback(transactionId, provider.name, nextProvider, err.code);
      await enqueueRoutingJob({
        ...job.data, excludeProviders: [...excludeProviders, provider.name],
        attemptNumber: job.data.attemptNumber + 1,
      });
    } else {
      await updateTransactionStatus(transactionId, TxStatus.FAILED);
      await createAuditLog({ transactionId, event: 'TRANSACTION_FAILED', payload: { reason: err.code } });
      logger.warn({ transactionId, provider: provider.name, errorCode: err.code }, 'Transaction failed — no more fallbacks');
    }
  }
}

export function createRoutingWorker() {
  const redisOptions = parseRedisUrl(env.REDIS_URL);
  return new Worker<RoutingJobPayload>(
    QUEUE_NAME,
    processJob,
    { connection: redisOptions, concurrency: CONCURRENCY },
  );
}
