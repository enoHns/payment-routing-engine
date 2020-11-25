import { FastifyPluginAsync } from 'fastify';
import { findTransactionById } from '../db/repositories/transactionRepo';
import { findAttemptsByTransactionId } from '../db/repositories/attemptRepo';
import type { TransactionResponse, AttemptResponse } from '../types/payment';

export const transactionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { id: string } }>(
    '/transactions/:id',
    async (request, reply) => {
      const tx = await findTransactionById(request.params.id);
      if (!tx) {
        return reply.code(404).send({
          statusCode: 404,
          error:      'Not Found',
          message:    `Transaction ${request.params.id} not found`,
        });
      }

      const attempts = await findAttemptsByTransactionId(tx.id);
      const attemptsResp: AttemptResponse[] = attempts.map(a => ({
        id:           a.id,
        providerName: a.providerName,
        status:       a.status,
        latencyMs:    a.latencyMs ?? null,
        createdAt:    a.createdAt.toISOString(),
      }));

      const response: TransactionResponse = {
        id:        tx.id,
        phone:     tx.phone,
        country:   tx.country,
        operator:  tx.operator ?? '',
        amount:    tx.amount,
        currency:  tx.currency,
        status:    tx.status,
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
        attempts:  attemptsResp,
      };
      return reply.code(200).send(response);
    },
  );
};
