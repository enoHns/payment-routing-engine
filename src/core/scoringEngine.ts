/**
 * Phase 4 — Provider Scoring Engine
 *
 * score(provider, operator, country) =
 *   w_sr  * successRate
 * + w_lat * (1 - latencyScore)
 * + w_pri * (1 - priorityScore)
 *
 * All components normalized [0..1]. Higher is better.
 */

export interface ProviderStats {
  successCount:   number;
  failureCount:   number;
  totalLatencyMs: number;
  sampleCount:    number;
}

export interface ScoringWeights {
  successRate:   number; // default 0.5
  latency:       number; // default 0.3
  priority:      number; // default 0.2
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  successRate: 0.5,
  latency:     0.3,
  priority:    0.2,
};

// Reference latency — requests faster than this score 1.0
const LATENCY_REFERENCE_MS = 5000;

export function computeSuccessRate(stats: ProviderStats): number {
  const total = stats.successCount + stats.failureCount;
  if (total === 0) return 0.5; // cold start: neutral
  return stats.successCount / total;
}

export function computeLatencyScore(stats: ProviderStats): number {
  if (stats.sampleCount === 0 || stats.totalLatencyMs === 0) return 0.5;
  const avgLatency = stats.totalLatencyMs / stats.sampleCount;
  // Normalize: 0ms → 1.0, LATENCY_REFERENCE_MS → 0.0, clamped
  const raw = 1 - avgLatency / LATENCY_REFERENCE_MS;
  return Math.max(0, Math.min(1, raw));
}

export function computeProviderScore(
  stats: ProviderStats,
  priority: number,
  maxPriority: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): number {
  const sr  = computeSuccessRate(stats);
  const lat = computeLatencyScore(stats);
  const pri = maxPriority > 1 ? 1 - (priority - 1) / (maxPriority - 1) : 1;

  return weights.successRate * sr
       + weights.latency     * lat
       + weights.priority    * pri;
}
