import Bull from 'bull';
import { getRedisClient } from '../cache/redis';
import logger from '../config/logger';

export interface RoutingJobPayload {
  transactionId:  string;
  phone:          string;
  amount:         number;
  currency:       string;
  country:        string;
  operator:       string;
  attemptNumber:  number;
  excludeProviders: string[];
  webhookUrl:     string;
}

const QUEUE_NAME = 'routing';

let queue: Bull.Queue<RoutingJobPayload> | null = null;

export function getRoutingQueue(): Bull.Queue<RoutingJobPayload> {
  if (!queue) {
    const redis = getRedisClient();

    queue = new Bull<RoutingJobPayload>(QUEUE_NAME, {
      createClient: (type) => {
        if (type === 'client') return redis;
        // Bull needs separate connections for subscriber/bclient
        return (redis as any).duplicate();
      },
      defaultJobOptions: {
        attempts:    1,
        removeOnComplete: 100,
        removeOnFail:     200,
      },
    });

    queue.on('error', (err) => logger.error({ err }, 'Routing queue error'));
    queue.on('failed', (job, err) => {
      logger.error({ jobId: job.id, transactionId: job.data.transactionId, err }, 'Job failed');
    });
  }

  return queue;
}

export async function enqueueRoutingJob(
  payload: RoutingJobPayload,
  delayMs = 0,
): Promise<Bull.Job<RoutingJobPayload>> {
  return getRoutingQueue().add(payload, { delay: delayMs });
}
