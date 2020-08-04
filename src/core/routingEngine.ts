import { getEligibleProviders, ProviderConfig } from './providerRegistry';
import { aggregateProviderStats } from './metricsAggregator';
import { computeProviderScore, DEFAULT_WEIGHTS } from './scoringEngine';
import { getCachedScore, setCachedScore } from './scoreCache';
import logger from '../config/logger';

export interface ScoredProvider {
  provider: ProviderConfig;
  score:    number;
}

async function getProviderScore(
  provider: ProviderConfig,
  operator: string,
  country: string,
): Promise<number> {
  // Try cache first
  const cached = await getCachedScore(provider.name, operator, country);
  if (cached !== null) {
    logger.debug({ provider: provider.name, score: cached }, 'Score from cache');
    return cached;
  }

  // Compute from DB metrics
  const stats = await aggregateProviderStats(provider.name, operator, country);
  const allProviders = getEligibleProviders(country, operator);
  const maxPriority  = Math.max(...allProviders.map(p => p.priority), 1);
  const score = computeProviderScore(stats, provider.priority, maxPriority, DEFAULT_WEIGHTS);

  // Cache result
  await setCachedScore(provider.name, operator, country, score);

  logger.debug({ provider: provider.name, operator, country, score }, 'Score computed');
  return score;
}

export async function rankProviders(
  operator: string,
  country: string,
): Promise<ScoredProvider[]> {
  const eligible = getEligibleProviders(country, operator);
  if (eligible.length === 0) {
    throw new Error(`No eligible providers for ${operator}/${country}`);
  }

  const scored = await Promise.all(
    eligible.map(async provider => ({
      provider,
      score: await getProviderScore(provider, operator, country),
    })),
  );

  return scored.sort((a, b) => b.score - a.score);
}

export async function selectBestProvider(
  operator: string,
  country: string,
): Promise<ScoredProvider> {
  const ranked = await rankProviders(operator, country);
  const best   = ranked[0];
  logger.info(
    { provider: best.provider.name, score: best.score, operator, country },
    'Provider selected',
  );
  return best;
}
