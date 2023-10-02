import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/prismaClient';
import { getRedisClient } from '../cache/redis';
import logger from '../config/logger';

interface ServiceStatus { status: 'ok' | 'degraded'; latency: number }

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: Date.now() - start };
  } catch (err) {
    logger.warn({ err }, 'DB health check failed');
    return { status: 'degraded', latency: Date.now() - start };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const pong = await getRedisClient().ping();
    return { status: pong === 'PONG' ? 'ok' : 'degraded', latency: Date.now() - start };
  } catch (err) {
    logger.warn({ err }, 'Redis health check failed');
    return { status: 'degraded', latency: Date.now() - start };
  }
}

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);
    const allOk = db.status === 'ok' && redis.status === 'ok';
    return reply.code(allOk ? 200 : 503).send({
      status:    allOk ? 'ok' : 'degraded',
      services:  { db, redis },
      timestamp: new Date().toISOString(),
    });
  });
};
