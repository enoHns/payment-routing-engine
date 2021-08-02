import type { FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';

export function isPrismaConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export function isPrismaNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

export function sendConflictError(reply: FastifyReply, message: string): FastifyReply {
  return reply.code(409).send({ statusCode: 409, error: 'Conflict', message });
}
