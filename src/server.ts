import fastify, { FastifyInstance } from 'fastify';
import helmet from 'fastify-helmet';
import rateLimit from 'fastify-rate-limit';
import { getRedisClient } from './cache/redis';
import logger from './config/logger';
import { env } from './config/env';

export async function buildServer(): Promise<FastifyInstance> {
  const server = fastify({
    logger: false, // We use pino directly
    trustProxy: true,
  });

  // Security headers
  await server.register(helmet);

  // Rate limiting — uses Redis store
  await server.register(rateLimit, {
    max:     env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    redis:   getRedisClient(),
    keyGenerator: (req) => req.headers['x-forwarded-for'] as string || req.ip,
  });

  // Request logging
  server.addHook('onRequest', async (req) => {
    logger.info({ method: req.method, url: req.url, reqId: req.id }, 'Incoming request');
  });

  server.addHook('onResponse', async (req, reply) => {
    logger.info(
      { method: req.method, url: req.url, statusCode: reply.statusCode, reqId: req.id },
      'Request completed',
    );
  });

  return server;
}
