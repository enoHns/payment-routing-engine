import { rankProviders } from './routingEngine';
import { isRetryable } from '../providers/base/ProviderResult';
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

export function shouldFallback(errorCode: string): boolean {
  return isRetryable(errorCode);
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
