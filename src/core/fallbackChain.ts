import { rankProviders } from './routingEngine';
import logger from '../config/logger';
import type { ScoredProvider } from './routingEngine';

interface FallbackOptions {
  maxAttempts:       number;
  excludeProviders?: string[];
}

export async function buildFallbackChain(
  operator: string,
  country:  string,
  options:  FallbackOptions,
): Promise<ScoredProvider[]> {
  const { maxAttempts, excludeProviders = [] } = options;
  const ranked = await rankProviders(operator, country);
  return ranked
    .filter(sp => !excludeProviders.includes(sp.provider.name))
    .slice(0, maxAttempts);
}

// Retryable codes — includes both provider-internal and public-facing variants.
// 'PROVIDER_TIMEOUT' / 'PROVIDER_NETWORK_ERROR' come from ProviderResult.ts;
// 'TIMEOUT' / 'NETWORK_ERROR' are used in some call sites and test scenarios.
// FIXME: unify code naming across layers (ProviderResult vs normalizeProviderError output)
const RETRYABLE_ERROR_CODES = new Set<string>([
  'PROVIDER_TIMEOUT',
  'TIMEOUT',
  'PROVIDER_NETWORK_ERROR',
  'NETWORK_ERROR',
]);

export function shouldFallback(errorCode: string): boolean {
  return RETRYABLE_ERROR_CODES.has(errorCode);
}

export function logFallback(
  transactionId: string,
  fromProvider:  string,
  toProvider:    string,
  reason:        string,
): void {
  logger.info(
    { transactionId, fromProvider, toProvider, reason },
    `Falling back from ${fromProvider} to ${toProvider}`,
  );
}
