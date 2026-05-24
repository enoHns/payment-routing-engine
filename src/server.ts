import fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getRedisClient } from './cache/redis';
import { errorHandlerPlugin } from './plugins/errorHandler';
import requestIdPlugin from './plugins/requestId';
import { healthRoutes } from './routes/health';
import { paymentRoutes } from './routes/payment';
import { transactionRoutes } from './routes/transactions';
import { webhookRoutes } from './routes/webhook';
import { adminMetricsRoutes } from './routes/admin/metrics';
import { env } from './config/env';
import logger from './config/logger';

export async function buildServer(): Promise<FastifyInstance> {
  const server = fastify({ logger: false, trustProxy: true });

  await server.register(helmet);
  await server.register(rateLimit, {
    max:          env.RATE_LIMIT_MAX,
    timeWindow:   env.RATE_LIMIT_WINDOW_MS,
    redis:        getRedisClient(),
    keyGenerator: (req) => req.ip,
  });

  server.addHook('onRequest', (request, _reply, done) => {
    logger.info({ method: request.method, url: request.url, requestId: request.id }, 'Incoming request');
    done();
  });

  server.addHook('onResponse', (request, reply, done) => {
    logger.info({
      method:       request.method,
      url:          request.url,
      statusCode:   reply.statusCode,
      responseTime: reply.elapsedTime,
      requestId:    request.id,
    }, 'Response sent');
    done();
  });

  await server.register(errorHandlerPlugin);
  await server.register(requestIdPlugin);
  await server.register(healthRoutes);
  await server.register(paymentRoutes);
  await server.register(transactionRoutes);
  await server.register(webhookRoutes);
  await server.register(adminMetricsRoutes);

  return server;
}
