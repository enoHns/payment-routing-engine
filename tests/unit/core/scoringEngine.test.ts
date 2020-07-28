import {
  computeSuccessRate,
  computeLatencyScore,
  computeProviderScore,
  DEFAULT_WEIGHTS,
  ProviderStats,
} from '../../../src/core/scoringEngine';

const PERFECT: ProviderStats = { successCount: 100, failureCount: 0,  totalLatencyMs: 100000, sampleCount: 100 };
const POOR:    ProviderStats = { successCount: 20,  failureCount: 80, totalLatencyMs: 400000, sampleCount: 100 };
const COLD:    ProviderStats = { successCount: 0,   failureCount: 0,  totalLatencyMs: 0,      sampleCount: 0   };

describe('computeSuccessRate', () => {
  it('returns 1.0 for 100% success', () => {
    expect(computeSuccessRate(PERFECT)).toBe(1.0);
  });
  it('returns 0.2 for 20% success', () => {
    expect(computeSuccessRate(POOR)).toBeCloseTo(0.2);
  });
  it('returns 0.5 for cold start', () => {
    expect(computeSuccessRate(COLD)).toBe(0.5);
  });
});

describe('computeLatencyScore', () => {
  it('returns 1.0 for very fast responses', () => {
    const fast: ProviderStats = { ...PERFECT, totalLatencyMs: 500, sampleCount: 1 };
    expect(computeLatencyScore(fast)).toBeGreaterThan(0.9);
  });
  it('returns 0.0 for latency at or above reference', () => {
    const slow: ProviderStats = { ...PERFECT, totalLatencyMs: 5000, sampleCount: 1 };
    expect(computeLatencyScore(slow)).toBe(0);
  });
  it('returns 0.5 for cold start', () => {
    expect(computeLatencyScore(COLD)).toBe(0.5);
  });
});

describe('computeProviderScore', () => {
  it('perfect provider scores near 1', () => {
    const score = computeProviderScore(PERFECT, 1, 5);
    expect(score).toBeGreaterThan(0.8);
  });
  it('poor provider scores lower than perfect', () => {
    const good = computeProviderScore(PERFECT, 1, 5);
    const bad  = computeProviderScore(POOR,    3, 5);
    expect(good).toBeGreaterThan(bad);
  });
  it('priority 1 scores higher than priority 5 (same stats)', () => {
    const highPri = computeProviderScore(PERFECT, 1, 5);
    const lowPri  = computeProviderScore(PERFECT, 5, 5);
    expect(highPri).toBeGreaterThan(lowPri);
  });
  it('weights sum to 1.0', () => {
    const { successRate, latency, priority } = DEFAULT_WEIGHTS;
    expect(successRate + latency + priority).toBeCloseTo(1.0);
  });
});
