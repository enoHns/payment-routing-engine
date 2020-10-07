import { Worker, Job } from 'bullmq';
import { RoutingJobPayload, enqueueRoutingJob } from './routingQueue';
import { buildFallbackChain, shouldFallback, logFallback } from '../core/fallbackChain';
import { getAdapter } from '../providers/adapterFactory';
import { normalizeProviderError } from '../utils/httpError';
import {
  createAttempt,
  updateAttempt,
  updateTransactionStatus,
  createAuditLog,
} from '../db/repositories';
import { AttemptStatus, TxStatus } from '@prisma/client';
import { env } from '../config/env';
import logger from '../config/logger';

const QUEUE_NAME  = 'routing';
const CONCURRENCY = 3;

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
      transactionId,
      event:   'PAYMENT_INITIATED',
      payload: { provider: provider.name, providerTxId: response.providerTxId },
    });

    logger.info({ transactionId, provider: provider.name, providerTxId: response.providerTxId }, 'Payment initiated');
  } catch (rawErr) {
    const err       = normalizeProviderError(rawErr);
    const latencyMs = Date.now() - startedAt;

    await updateAttempt(attempt.id, {
      status:       AttemptStatus.FAILED,
      latencyMs,
      errorCode:    err.code,
      errorMessage: err.message,
      resolvedAt:   new Date(),
    });

    await createAuditLog({ transactionId, event: 'PROVIDER_ERROR', payload: { provider: provider.name, ...err } });

    if (shouldFallback(err.code) && chain.length > 1) {
      const nextProvider = chain[1].provider.name;
      logFallback(transactionId, provider.name, nextProvider, err.code);
      await enqueueRoutingJob({
        ...job.data,
        excludeProviders: [...excludeProviders, provider.name],
        attemptNumber:    job.data.attemptNumber + 1,
      });
    } else {
      await updateTransactionStatus(transactionId, TxStatus.FAILED);
      await createAuditLog({ transactionId, event: 'TRANSACTION_FAILED', payload: { reason: err.code } });
    }
  }
}

let worker: Worker<RoutingJobPayload> | null = null;

export function startRoutingWorker(): Worker<RoutingJobPayload> {
  const connection = {
    host: new URL(env.REDIS_URL).hostname,
    port: parseInt(new URL(env.REDIS_URL).port || '6379'),
  };

  worker = new Worker<RoutingJobPayload>(QUEUE_NAME, processJob, { connection, concurrency: CONCURRENCY });

  worker.on('completed', (job) =>
    logger.info({ jobId: job.id, transactionId: job.data.transactionId }, 'Job completed'),
  );
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, 'Job failed'),
  );

  logger.info({ concurrency: CONCURRENCY }, 'Routing worker started');
  return worker;
}

export async function stopRoutingWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Routing worker stopped');
  }
}
