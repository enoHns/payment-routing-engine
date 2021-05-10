import { FastifyPluginAsync } from 'fastify';
import { getAllProviderCombinations } from '../../db/repositories/metricsRepo';
import { getCachedScore, setCachedScore } from '../../core/scoreCache';
import { getRecentProviderStats } from '../../core/metricsAggregator';
import { computeProviderScore, DEFAULT_WEIGHTS } from '../../core/scoringEngine';
import { getAllActiveProviders } from '../../core/providerRegistry';
import logger from '../../config/logger';

interface MetricEntry {
  providerName:  string;
  operator:      string;
  country:       string;
  score:         number;
  successRate?:  number;
  source:        'cache' | 'computed' | 'default';
}

export const adminMetricsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/metrics', async (_request, reply) => {
    try {
      const combos = await getAllProviderCombinations();

      if (combos.length === 0) {
        const providers = getAllActiveProviders();
        return reply.code(200).send({
          data:    providers.map(p => ({ providerName: p.name, operator: '', country: '', score: 0.5, source: 'default' })),
          total:   providers.length,
          message: 'No metrics data yet — showing default scores',
        });
      }

      const results: MetricEntry[] = await Promise.all(
        combos.map(async ({ providerName, operator, country }) => {
          const cached = await getCachedScore(providerName, operator, country);
          if (cached !== null) {
            return { providerName, operator, country, score: cached, source: 'cache' as const };
          }

          const stats = await getRecentProviderStats(providerName, operator, country);
          const score = computeProviderScore(stats, 1, 5, DEFAULT_WEIGHTS);
          await setCachedScore(providerName, operator, country, score);

          const total = stats.successCount + stats.failureCount;
          return {
            providerName,
            operator,
            country,
            score,
            successRate: total > 0 ? stats.successCount / total : undefined,
            source:      'computed' as const,
          };
        }),
      );

      return reply.code(200).send({ data: results, total: results.length });
    } catch (err) {
      logger.error({ err }, 'Failed to compute metrics summary');
      return reply.code(500).send({ statusCode: 500, error: 'Internal Server Error', message: 'Metrics unavailable' });
    }
  });
};
