import { getRecentMetrics } from '../db/repositories/metricsRepo';
import { ProviderStats } from './scoringEngine';

const SCORING_WINDOW_HOURS = 24;

export async function aggregateProviderStats(
  providerName: string,
  operator: string,
  country: string,
): Promise<ProviderStats> {
  const windows = await getRecentMetrics(providerName, operator, country, SCORING_WINDOW_HOURS);

  if (windows.length === 0) {
    return { successCount: 0, failureCount: 0, totalLatencyMs: 0, sampleCount: 0 };
  }

  return windows.reduce<ProviderStats>(
    (acc, w) => ({
      successCount:   acc.successCount   + w.successCount,
      failureCount:   acc.failureCount   + w.failureCount,
      totalLatencyMs: acc.totalLatencyMs + Number(w.totalLatencyMs),
      sampleCount:    acc.sampleCount    + w.sampleCount,
    }),
    { successCount: 0, failureCount: 0, totalLatencyMs: 0, sampleCount: 0 },
  );
}

// Public alias — routingEngine and admin/metrics route import this name.
// TODO: consolidate to a single name in a future minor refactor
export const getRecentProviderStats = aggregateProviderStats;
