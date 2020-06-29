import { FastifyInstance, FastifyError } from 'fastify';
import logger from '../config/logger';

export async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler(async (error: FastifyError, _req, reply) => {
    const status = error.statusCode ?? 500;

    if (status >= 500) {
      logger.error({ err: error }, 'Unhandled server error');
    } else {
      logger.warn({ err: error }, 'Client error');
    }

    if (status === 429) {
      return reply.status(429).send({ error: 'Too Many Requests', statusCode: 429 });
    }

    return reply.status(status).send({
      error:      error.name || 'Error',
      message:    status < 500 ? error.message : 'Internal server error',
      statusCode: status,
    });
  });
}
