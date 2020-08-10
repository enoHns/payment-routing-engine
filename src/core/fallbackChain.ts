import { ScoredProvider, rankProviders } from './routingEngine';
import { isRetryable } from '../providers/base/ProviderResult';
import logger from '../config/logger';

export interface FallbackOptions {
  maxAttempts:     number;
  excludeProviders?: string[];
}

const DEFAULT_OPTIONS: FallbackOptions = { maxAttempts: 3 };

/**
 * Returns the ordered list of providers to try, excluding those already
 * attempted and respecting maxAttempts.
 */
export async function buildFallbackChain(
  operator: string,
  country: string,
  options: FallbackOptions = DEFAULT_OPTIONS,
): Promise<ScoredProvider[]> {
  const exclude = new Set(options.excludeProviders ?? []);
  const ranked  = await rankProviders(operator, country);
  const chain   = ranked.filter(sp => !exclude.has(sp.provider.name));

  return chain.slice(0, options.maxAttempts);
}

/**
 * Determines whether an error justifies trying the next provider
 * in the chain, or should abort the whole transaction.
 */
export function shouldFallback(errorCode: string): boolean {
  // Retryable errors (network, timeout) → try next provider
  // Business errors (insufficient funds, duplicate) → abort
  return isRetryable(errorCode);
}

export function logFallback(
  transactionId: string,
  failedProvider: string,
  nextProvider: string,
  errorCode: string,
): void {
  logger.warn(
    { transactionId, failedProvider, nextProvider, errorCode },
    'Provider failed — falling back',
  );
}
