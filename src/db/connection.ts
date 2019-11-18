import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import { env } from '../config/env';
import logger from '../config/logger';

let connection: Connection | null = null;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function connectDatabase(retries = MAX_RETRIES): Promise<Connection> {
  if (connection && connection.isConnected) {
    return connection;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      connection = await createConnection({
        type: 'postgres',
        url: env.DATABASE_URL,
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
      });

      logger.info({ event: 'db_connected', attempt }, 'Database connected');
      return connection;
    } catch (err) {
      if (attempt === retries) {
        logger.error({ err, event: 'db_connect_failed' }, 'Database connection failed after all retries');
        throw err;
      }
      logger.warn({ attempt, retries, retryIn: RETRY_DELAY_MS }, 'DB connection failed, retrying...');
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new Error('Unreachable');
}

export async function disconnectDatabase(): Promise<void> {
  if (connection && connection.isConnected) {
    await connection.close();
    connection = null;
    logger.info({ event: 'db_disconnected' }, 'Database disconnected');
  }
}

export function getConnection(): Connection {
  if (!connection || !connection.isConnected) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return connection;
}
