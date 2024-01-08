import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { normalizePhone } from '../utils/phone';
import { tryResolveOperator } from '../core/phoneResolver';
import { sendZodError } from '../utils/zodError';
import {
  createTransaction,
  findByIdempotencyKey,
} from '../db/repositories/transactionRepo';
import { enqueueRoutingJob } from '../jobs/routingQueue';
import { env } from '../config/env';
import logger from '../config/logger';
import type { InitiatePaymentBody, InitiatePaymentResponse } from '../types/payment';

const paymentSchema = z.object({
  phone:          z.string().min(8).max(20).trim(),
  amount:         z.number().positive().finite(),
  currency:       z.string().length(3).toUpperCase(),
  idempotencyKey: z.string().uuid().optional(),
  webhookUrl:     z.string().url().optional(),
}).strict();

type PaymentInput = z.infer<typeof paymentSchema>;

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: InitiatePaymentBody }>(
    '/payment',
    async (request: FastifyRequest<{ Body: InitiatePaymentBody }>, reply: FastifyReply) => {
      const parsed = paymentSchema.safeParse(request.body);
      if (!parsed.success) return sendZodError(reply, parsed.error);

      const { phone, amount, currency, idempotencyKey, webhookUrl }: PaymentInput = parsed.data;
      const normalized = normalizePhone(phone);

      const resolved = tryResolveOperator(normalized);
      if (!resolved) {
        return reply.code(422).send({
          statusCode: 422,
          error:      'Unprocessable Entity',
          message:    `Cannot resolve operator for phone: ${phone}`,
        });
      }

      const { country, operator } = resolved;

      if (idempotencyKey) {
        const existing = await findByIdempotencyKey(idempotencyKey);
        if (existing) {
          return reply.code(202).send({ transactionId: existing.id, status: existing.status });
        }
      }

      const tx = await createTransaction({
        phone:      normalized,
        country,
        operator,
        amount,
        currency,
        idempotencyKey,
        webhookUrl: webhookUrl ?? `${env.WEBHOOK_BASE_URL}/webhook`,
      });

      await enqueueRoutingJob({
        transactionId:    tx.id,
        phone:            normalized,
        amount,
        currency,
        country,
        operator,
        attemptNumber:    1,
        excludeProviders: [],
        webhookUrl:       webhookUrl ?? `${env.WEBHOOK_BASE_URL}/webhook`,
      });

      logger.info({ transactionId: tx.id, country, operator }, 'Payment initiated');

      const response: InitiatePaymentResponse = { transactionId: tx.id, status: 'INITIATED' };
      return reply.code(202).send(response);
    },
  );
};
