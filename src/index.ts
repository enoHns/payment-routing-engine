import logger from './config/logger';

async function bootstrap() {
  logger.info('Payment Routing Engine — starting up...');
  // TODO: initialize database, redis, server, job workers
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
