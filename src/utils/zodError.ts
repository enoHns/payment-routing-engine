import type { ZodError } from 'zod';
import type { FastifyReply } from 'fastify';

export function sendZodError(reply: FastifyReply, err: ZodError): FastifyReply {
  const message = err.issues
    .map(i => `${i.path.length > 0 ? i.path.join('.') + ': ' : ''}${i.message}`)
    .join('; ');
  return reply.code(400).send({ statusCode: 400, error: 'Bad Request', message });
}
