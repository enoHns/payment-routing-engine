import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import Joi from '@hapi/joi';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from '../utils/phone';
import { tryResolveOperator } from '../core/phoneResolver';
import {
  createTransaction,
  findByIdempotencyKey,
} from '../db/repositories/transactionRepo';
import { enqueueRoutingJob } from '../jobs/routingQueue';
import { env } from '../config/env';
import logger from '../config/logger';
import type { InitiatePaymentBody, InitiatePaymentResponse } from '../types/payment';

const bodySchema = Joi.object({
  phone:          Joi.string().min(8).max(20).required(),
  amount:         Joi.number().positive().required(),
  currency:       Joi.string().length(3).uppercase().required(),
  idempotencyKey: Joi.string().uuid().optional(),
  webhookUrl:     Joi.string().uri().optional(),
}).options({ allowUnknown: false });

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: InitiatePaymentBody }>(
    '/payment',
    async (request: FastifyRequest<{ Body: InitiatePaymentBody }>, reply: FastifyReply) => {
      const { error, value } = bodySchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          statusCode: 400,
          error:      'Bad Request',
          message:    error.details[0].message,
        });
      }

      const { phone, amount, currency, idempotencyKey, webhookUrl } = value;
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
          return reply.code(202).send({
            transactionId: existing.id,
            status:        existing.status,
          });
        }
      }

      const tx = await createTransaction({
        phone:     normalized,
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
        webhookUrl:       tx.webhookUrl ?? `${env.WEBHOOK_BASE_URL}/webhook/${tx.id}`,
      });

      logger.info({ transactionId: tx.id, country, operator }, 'Payment initiated');

      const response: InitiatePaymentResponse = {
        transactionId: tx.id,
        status:        'INITIATED',
      };
      return reply.code(202).send(response);
    },
  );
};
