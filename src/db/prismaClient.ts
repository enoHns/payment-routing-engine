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

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info({ event: 'db_disconnected' }, 'Prisma disconnected');
  }
}
