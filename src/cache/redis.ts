import Redis from 'ioredis';
import { env } from '../config/env';
import logger from '../config/logger';

let client: Redis.Redis | null = null;

export function getRedisClient(): Redis.Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    client.on('connect', () => logger.info({ event: 'redis_connected' }, 'Redis connected'));
    client.on('error', (err) => logger.error({ err, event: 'redis_error' }, 'Redis error'));
    client.on('reconnecting', () => logger.warn({ event: 'redis_reconnecting' }, 'Redis reconnecting'));
  }

  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    logger.info({ event: 'redis_closed' }, 'Redis connection closed');
  }
}
