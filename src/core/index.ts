export {
  resolveOperator,
  tryResolveOperator,
  normalizePhone,
  isSupportedCountry,
} from './phoneResolver';
export type { ResolveResult } from './phoneResolver';

export {
  getEligibleProviders,
  getProviderByName,
  getAllActiveProviders,
} from './providerRegistry';
export type { ProviderConfig } from './providerRegistry';

export {
  computeProviderScore,
  computeSuccessRate,
  computeLatencyScore,
  DEFAULT_WEIGHTS,
} from './scoringEngine';
export type { ProviderStats, ScoringWeights } from './scoringEngine';

export { rankProviders, selectBestProvider } from './routingEngine';
export type { ScoredProvider } from './routingEngine';

export { buildFallbackChain, shouldFallback } from './fallbackChain';
export { recordAttemptOutcome } from './metricsUpdater';
