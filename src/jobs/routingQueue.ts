import { Queue } from 'bullmq';
import { env } from '../config/env';
import logger from '../config/logger';

export interface RoutingJobPayload {
  transactionId:    string;
  phone:            string;
  amount:           number;
  currency:         string;
  country:          string;
  operator:         string;
  attemptNumber:    number;
  excludeProviders: string[];
  webhookUrl:       string;
}

const QUEUE_NAME = 'routing';

function parseRedisUrl(url: string) {
  const u = new URL(url);
  return { host: u.hostname, port: parseInt(u.port || '6379', 10) };
}

let queue: Queue<RoutingJobPayload> | null = null;

export function getRoutingQueue(): Queue<RoutingJobPayload> {
  if (!queue) {
    queue = new Queue<RoutingJobPayload>(QUEUE_NAME, {
      connection: parseRedisUrl(env.REDIS_URL),
      defaultJobOptions: {
        attempts:         1,
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 200 },
      },
    });
    queue.on('error', (err) => logger.error({ err }, 'Routing queue error'));
  }
  return queue;
}

export async function enqueueRoutingJob(payload: RoutingJobPayload, delayMs = 0): Promise<void> {
  await getRoutingQueue().add('route', payload, { delay: delayMs });
  logger.debug({ transactionId: payload.transactionId }, 'Routing job enqueued');
}

export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
