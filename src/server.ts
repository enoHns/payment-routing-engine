import fastify, { FastifyInstance } from 'fastify';
import helmet from 'fastify-helmet';
import rateLimit from 'fastify-rate-limit';
import { getRedisClient } from './cache/redis';
import { errorHandlerPlugin } from './plugins/errorHandler';
import { healthRoutes } from './routes/health';
import logger from './config/logger';
import { env } from './config/env';

export async function buildServer(): Promise<FastifyInstance> {
  const server = fastify({ logger: false, trustProxy: true });

  await server.register(helmet);
  await server.register(rateLimit, {
    max:          env.RATE_LIMIT_MAX,
    timeWindow:   env.RATE_LIMIT_WINDOW_MS,
    redis:        getRedisClient(),
    keyGenerator: (req) => (req.headers['x-forwarded-for'] as string) || req.ip,
  });

  await server.register(errorHandlerPlugin);
  await server.register(healthRoutes);

  server.addHook('onRequest', async (req) => {
    logger.info({ method: req.method, url: req.url, reqId: req.id }, '→');
  });
  server.addHook('onResponse', async (req, reply) => {
    logger.info({ method: req.method, url: req.url, status: reply.statusCode, reqId: req.id }, '←');
  });

  return server;
}
