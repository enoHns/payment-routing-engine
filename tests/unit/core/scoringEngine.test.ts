import { describe, it, expect } from 'vitest';
import {
  computeSuccessRate,
  computeLatencyScore,
  computeProviderScore,
  DEFAULT_WEIGHTS,
} from '../../../src/core/scoringEngine';

describe('computeSuccessRate', () => {
  it('returns 0.5 for cold start', () => {
    expect(computeSuccessRate({ successCount: 0, failureCount: 0, totalLatencyMs: 0, sampleCount: 0 })).toBe(0.5);
  });
  it('returns 1.0 for all success', () => {
    expect(computeSuccessRate({ successCount: 10, failureCount: 0, totalLatencyMs: 0, sampleCount: 10 })).toBe(1);
  });
  it('returns 0 for all failure', () => {
    expect(computeSuccessRate({ successCount: 0, failureCount: 5, totalLatencyMs: 0, sampleCount: 5 })).toBe(0);
  });
  it('computes partial rate correctly', () => {
    expect(computeSuccessRate({ successCount: 8, failureCount: 2, totalLatencyMs: 0, sampleCount: 8 })).toBeCloseTo(0.8);
  });
});

describe('computeLatencyScore', () => {
  it('returns 0.5 for cold start', () => {
    expect(computeLatencyScore({ successCount: 0, failureCount: 0, totalLatencyMs: 0, sampleCount: 0 })).toBe(0.5);
  });
  it('penalizes high latency', () => {
    const low  = computeLatencyScore({ successCount: 10, failureCount: 0, totalLatencyMs: 5000,  sampleCount: 10 });
    const high = computeLatencyScore({ successCount: 10, failureCount: 0, totalLatencyMs: 25000, sampleCount: 10 });
    expect(low).toBeGreaterThan(high);
  });
});

describe('computeProviderScore', () => {
  it('stays within [0,1]', () => {
    const s = computeProviderScore(
      { successCount: 10, failureCount: 0, totalLatencyMs: 1000, sampleCount: 10 }, 1, 3, DEFAULT_WEIGHTS,
    );
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
  it('returns mid score on cold start', () => {
    const s = computeProviderScore(
      { successCount: 0, failureCount: 0, totalLatencyMs: 0, sampleCount: 0 }, 1, 1, DEFAULT_WEIGHTS,
    );
    expect(s).toBeCloseTo(0.5, 1);
  });
});
