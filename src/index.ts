import 'reflect-metadata';
import { connectDatabase, disconnectDatabase } from './db/connection';
import { getRedisClient, closeRedis } from './cache/redis';
import logger from './config/logger';

async function bootstrap() {
  logger.info('Payment Routing Engine — starting up...');

  await connectDatabase();
  getRedisClient(); // initialise connection

  logger.info('Infrastructure ready. Routing engine online.');

  // TODO: start Fastify server
  // TODO: register BullMQ workers
}

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');
  await disconnectDatabase();
  await closeRedis();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap().catch(err => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
