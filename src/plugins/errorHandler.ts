import { FastifyPluginAsync, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import logger from '../config/logger';

interface ErrorBody {
  statusCode: number;
  error:      string;
  message:    string;
}

function toSafeError(err: FastifyError): ErrorBody {
  const statusCode = err.statusCode ?? 500;
  if (statusCode === 429) {
    return { statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' };
  }
  if (statusCode >= 500) {
    logger.error({ err, statusCode }, 'Unhandled server error');
    return { statusCode: 500, error: 'Internal Server Error', message: 'An unexpected error occurred' };
  }
  return { statusCode, error: err.name ?? 'Error', message: err.message };
}

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler(
    (err: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
      const body = toSafeError(err);
      return reply.code(body.statusCode).send(body);
    },
  );
};

export { errorHandlerPlugin };
export default fp(errorHandlerPlugin, { name: 'errorHandler' });
