import { upsertMetricWindow } from '../db/repositories/metricsRepo';
import { invalidateScore } from './scoreCache';
import logger from '../config/logger';

/**
 * Returns current hour as Date (minutes/seconds/ms = 0).
 */
export function getCurrentWindowStart(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now;
}

export async function recordAttemptOutcome(
  providerName: string,
  operator: string,
  country: string,
  success: boolean,
  latencyMs?: number,
): Promise<void> {
  const windowStart = getCurrentWindowStart();
  await upsertMetricWindow(providerName, operator, country, windowStart, success ? 'SUCCESS' : 'FAILURE', latencyMs);
  await invalidateScore(providerName, operator, country);
  logger.debug({ providerName, operator, country, success, latencyMs }, 'Metric recorded');
}
