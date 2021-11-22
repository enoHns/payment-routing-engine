import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

prisma.$on('warn',  (e) => logger.warn({ message: e.message },  'Prisma warning'));
prisma.$on('error', (e) => logger.error({ message: e.message }, 'Prisma error'));

/**
 * Returns the shared Prisma singleton.
 * Using a function here (instead of direct export) makes it easy to swap the
 * instance in unit tests via vi.mock('../db/prismaClient', () => ({ getPrismaClient: () => mockPrisma })).
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

export async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      logger.error({ err }, 'Database connection failed after max retries');
      throw err;
    }
    logger.warn({ attempt, MAX_RETRIES, retryIn: RETRY_DELAY }, 'DB connection failed — retrying');
    await new Promise(r => setTimeout(r, RETRY_DELAY));
    return connectWithRetry(attempt + 1);
  }
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
