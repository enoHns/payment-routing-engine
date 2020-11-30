import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { processWebhook } from '../handlers/webhookHandler';
import logger from '../config/logger';

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      try {
        const parsed = JSON.parse((body as Buffer).toString('utf-8'));
        done(null, { _raw: body, ...parsed });
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  fastify.post<{ Params: { provider: string } }>(
    '/webhook/:provider',
    async (request: FastifyRequest<{ Params: { provider: string } }>, reply: FastifyReply) => {
      const { provider } = request.params;
      const body         = request.body as Record<string, unknown>;
      const { _raw, ...payload } = body;
      const signature = (request.headers['x-webhook-signature']
        ?? request.headers['x-kkiapay-signature']
        ?? request.headers['x-feexpay-signature']) as string | undefined;

      try {
        const result = await processWebhook(provider, payload, signature);
        logger.info({ provider, result }, 'Webhook processed');
        return reply.code(200).send({ received: true, status: result.status });
      } catch (err) {
        logger.error({ provider, err }, 'Webhook processing error');
        return reply.code(200).send({ received: true, status: 'ERROR' });
      }
    },
  );
};
