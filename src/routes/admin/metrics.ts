import { FastifyPluginAsync } from 'fastify';
import { getRecentMetrics, getAllProviderCombinations } from '../../db/repositories/metricsRepo';
import { getCachedScore, setCachedScore } from '../../core/scoreCache';
import { getRecentProviderStats } from '../../core/metricsAggregator';
import { computeProviderScore, DEFAULT_WEIGHTS } from '../../core/scoringEngine';
import logger from '../../config/logger';

export const adminMetricsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/metrics', async (_request, reply) => {
    try {
      const combos = await getAllProviderCombinations();

      const results = await Promise.all(
        combos.map(async ({ providerName, operator, country }) => {
          const cached = await getCachedScore(providerName, operator, country);
          if (cached !== null) {
            return { providerName, operator, country, score: cached, source: 'cache' };
          }

          const stats = await getRecentProviderStats(providerName, operator, country);
          const score = computeProviderScore(stats, 1, 5, DEFAULT_WEIGHTS);
          await setCachedScore(providerName, operator, country, score);

          return {
            providerName,
            operator,
            country,
            score,
            successRate: stats.successCount / Math.max(1, stats.successCount + stats.failureCount),
            source: 'computed',
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
