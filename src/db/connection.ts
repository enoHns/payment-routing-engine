import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import { env } from '../config/env';
import logger from '../config/logger';

let connection: Connection | null = null;

export async function connectDatabase(): Promise<Connection> {
  if (connection && connection.isConnected) {
    return connection;
  }

  try {
    connection = await createConnection({
      type: 'postgres',
      url: env.DATABASE_URL,
      entities: [__dirname + '/entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
    });

    logger.info({ event: 'db_connected' }, 'Database connected');
    return connection;
  } catch (err) {
    logger.error({ err, event: 'db_connect_failed' }, 'Database connection failed');
    throw err;
  }
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
