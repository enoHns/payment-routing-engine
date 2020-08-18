import Bull from 'bull';
import { RoutingJobPayload, getRoutingQueue } from './routingQueue';
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

async function processRoutingJob(job: Bull.Job<RoutingJobPayload>): Promise<void> {
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

  try {
    await updateTransactionStatus(transactionId, TxStatus.PROCESSING);

    const response = await adapter.initiatePayment({
      transactionId,
      phone,
      amount,
      currency,
      country,
      operator,
      webhookUrl,
    });

    await updateAttempt(attempt.id, {
      providerTxId: response.providerTxId,
      status:       AttemptStatus.PENDING, // resolved by webhook
      latencyMs:    Date.now() - startedAt,
    });

    await createAuditLog({
      transactionId,
      event:   'PAYMENT_INITIATED',
      payload: { provider: provider.name, providerTxId: response.providerTxId },
    });

    logger.info({ transactionId, provider: provider.name, providerTxId: response.providerTxId }, 'Payment initiated');
  } catch (rawErr) {
    const err = normalizeProviderError(rawErr);
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

      // Re-enqueue with the failed provider excluded
      await getRoutingQueue().add({
        ...job.data,
        excludeProviders: [...excludeProviders, provider.name],
      });
    } else {
      await updateTransactionStatus(transactionId, TxStatus.FAILED);
      await createAuditLog({ transactionId, event: 'TRANSACTION_FAILED', payload: { reason: err.code } });
    }
  }
}

export function startRoutingProcessor(): void {
  getRoutingQueue().process(3, processRoutingJob);
  logger.info('Routing job processor started (concurrency: 3)');
}
