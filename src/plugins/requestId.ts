import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onSend', (_request, reply, _payload, done) => {
    reply.header('X-Request-Id', reply.request.id);
    done();
  });
};

export default fp(requestIdPlugin, { name: 'requestId' });
