import { connectWithRetry, disconnectPrisma } from './db/prismaClient';
import { getRedisClient, closeRedis } from './cache/redis';
import logger from './config/logger';

async function bootstrap() {
  logger.info('Payment Routing Engine — starting up...');
  await connectWithRetry();
  getRedisClient();
  logger.info('Infrastructure ready.');
  // TODO: start Fastify server
  // TODO: register BullMQ workers
}

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');
  await disconnectPrisma();
  await closeRedis();
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
