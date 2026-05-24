import { getEligibleProviders } from './providerRegistry';
import { getRecentProviderStats } from './metricsAggregator';
import { computeProviderScore, DEFAULT_WEIGHTS } from './scoringEngine';
import { getCachedScore, setCachedScore } from './scoreCache';
import logger from '../config/logger';

export interface ScoredProvider {
  provider:    ReturnType<typeof getEligibleProviders>[number];
  score:       number;
  fromCache:   boolean;
}

export async function rankProviders(
  operator: string,
  country:  string,
): Promise<ScoredProvider[]> {
  const eligible = getEligibleProviders(country, operator);
  if (eligible.length === 0) return [];

  const maxPriority = Math.max(...eligible.map(p => p.priority));

  const scored = await Promise.all(
    eligible.map(async (provider): Promise<ScoredProvider> => {
      const cached = await getCachedScore(provider.name, operator, country);
      if (cached !== null) {
        return { provider, score: cached, fromCache: true };
      }
      const stats = await getRecentProviderStats(provider.name, operator, country);
      const score = computeProviderScore(stats, provider.priority, maxPriority, provider.weights ?? DEFAULT_WEIGHTS);
      await setCachedScore(provider.name, operator, country, score);
      return { provider, score, fromCache: false };
    }),
  );

  scored.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) > 1e-9) return diff;
    return a.provider.priority - b.provider.priority;
  });

  logger.debug({ operator, country, ranked: scored.map(s => ({ name: s.provider.name, score: s.score })) }, 'Providers ranked');
  return scored;
}

export function selectBestProvider(ranked: ScoredProvider[]): ScoredProvider | null {
  return ranked.length > 0 ? ranked[0] : null;
}
