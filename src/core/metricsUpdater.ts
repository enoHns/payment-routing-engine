import { upsertMetricWindow } from '../db/repositories/metricsRepo';
import { invalidateScore } from './scoreCache';
import logger from '../config/logger';

function getWindowStart(): Date {
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
  const windowStart = getWindowStart();
  const outcome = success ? 'SUCCESS' : 'FAILURE';
  await upsertMetricWindow(providerName, operator, country, windowStart, outcome, latencyMs);
  await invalidateScore(providerName, operator, country);
  logger.debug({ providerName, operator, country, outcome, latencyMs }, 'Metric recorded');
}
