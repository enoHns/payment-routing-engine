import { connectWithRetry, disconnectPrisma } from './db/prismaClient';
import { getRedisClient, closeRedis } from './cache/redis';
import { buildServer } from './server';
import { startRoutingWorker, stopRoutingWorker } from './jobs/routingWorker';
import { closeQueue } from './jobs/routingQueue';
import logger from './config/logger';
import { env } from './config/env';

async function bootstrap() {
  logger.info('Payment Routing Engine — starting up...');
  await connectWithRetry();
  getRedisClient();
  const server = await buildServer();
  await server.listen(env.PORT, '0.0.0.0');
  logger.info({ port: env.PORT }, 'HTTP server listening');
  startRoutingWorker();
  logger.info('All systems nominal');
}

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received — draining...');
  await stopRoutingWorker();
  await closeQueue();
  await disconnectPrisma();
  await closeRedis();
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

bootstrap().catch(err => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
