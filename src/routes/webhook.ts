import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { processWebhook } from '../handlers/webhookHandler';
import logger from '../config/logger';

function extractSignature(req: FastifyRequest): string | undefined {
  return (
    req.headers['x-webhook-signature']    ??
    req.headers['x-kkiapay-signature']    ??
    req.headers['x-feexpay-signature']    ??
    req.headers['x-paydunya-signature']
  ) as string | undefined;
}

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      try {
        done(null, JSON.parse((body as Buffer).toString('utf-8')));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  fastify.post<{ Params: { provider: string } }>(
    '/webhook/:provider',
    async (request, reply) => {
      const { provider } = request.params;
      const signature    = extractSignature(request);
      const payload      = request.body as Record<string, unknown>;

      try {
        const result = await processWebhook(provider, payload, signature);
        return reply.code(200).send({ received: true, status: result.status });
      } catch (err) {
        logger.error({ provider, err }, 'Webhook processing unhandled error');
        return reply.code(200).send({ received: true, status: 'ERROR' });
      }
    },
  );
};
