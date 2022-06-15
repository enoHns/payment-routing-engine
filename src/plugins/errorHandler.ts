import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../config/logger';

interface ErrorBody { statusCode: number; error: string; message: string }

function toSafeError(err: FastifyError): ErrorBody {
  const code = err.statusCode ?? 500;
  if (code === 429) return { statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' };
  if (code >= 500) {
    logger.error({ err, statusCode: code }, 'Unhandled server error');
    return { statusCode: 500, error: 'Internal Server Error', message: 'An unexpected error occurred' };
  }
  return { statusCode: code, error: err.name ?? 'Error', message: err.message };
}

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((err: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
    const body = toSafeError(err);
    return reply.code(body.statusCode).send(body);
  });
};

export { errorHandlerPlugin };
export default fp(errorHandlerPlugin, { name: 'errorHandler', fastify: '4.x' });
