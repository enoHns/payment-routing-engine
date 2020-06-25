import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../db/prismaClient';
import { getRedisClient } from '../cache/redis';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    const checks: Record<string, 'ok' | 'error'> = {};

    // Check Postgres via Prisma
    try {
      await getPrismaClient().$queryRaw`SELECT 1`;
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
    }

    // Check Redis
    try {
      await getRedisClient().ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    const allOk = Object.values(checks).every(v => v === 'ok');
    reply.status(allOk ? 200 : 503).send({ status: allOk ? 'ok' : 'degraded', checks });
  });
}
