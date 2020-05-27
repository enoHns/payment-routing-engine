import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }]
        : [{ emit: 'event', level: 'error' }],
    });
    (prisma as any).$on('warn',  (e: any) => logger.warn({ msg: e.message }, 'Prisma warn'));
    (prisma as any).$on('error', (e: any) => logger.error({ msg: e.message }, 'Prisma error'));
  }
  return prisma;
}

const MAX_RETRIES  = 5;
const RETRY_DELAY  = 3000;

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function connectWithRetry(): Promise<void> {
  const client = getPrismaClient();
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await client.$connect();
      logger.info({ event: 'db_connected', attempt }, 'Prisma connected');
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      logger.warn({ attempt, retryIn: RETRY_DELAY }, 'Prisma connect failed, retrying...');
      await sleep(RETRY_DELAY);
    }
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info({ event: 'db_disconnected' }, 'Prisma disconnected');
  }
}
