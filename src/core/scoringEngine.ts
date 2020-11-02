/**
 * Phase 4 — Provider Scoring Engine
 *
 * score = w_sr * successRate + w_lat * latencyScore + w_pri * priorityScore
 * All components in [0..1]. Higher = better.
 */

export interface ProviderStats {
  successCount:   number;
  failureCount:   number;
  totalLatencyMs: number;
  sampleCount:    number;
}

export interface ScoringWeights {
  successRate: number;
  latency:     number;
  priority:    number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  successRate: 0.5,
  latency:     0.3,
  priority:    0.2,
};

const LATENCY_REFERENCE_MS = 5000;

export function computeSuccessRate(stats: ProviderStats): number {
  const total = stats.successCount + stats.failureCount;
  if (total === 0) return 0.5;
  return stats.successCount / total;
}

export function computeLatencyScore(stats: ProviderStats): number {
  if (stats.sampleCount === 0 || stats.totalLatencyMs === 0) return 0.5;
  const avg = stats.totalLatencyMs / stats.sampleCount;
  return Math.max(0, Math.min(1, 1 - avg / LATENCY_REFERENCE_MS));
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

  const raw = weights.successRate * sr
            + weights.latency     * lat
            + weights.priority    * pri;

  return Math.max(0, Math.min(1, raw));
}
