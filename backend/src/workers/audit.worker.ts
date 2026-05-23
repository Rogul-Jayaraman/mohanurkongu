import { Worker } from 'bullmq';
import { queueConfig } from '../config/queue.config.js';
import { logger } from '../common/utils/logger.js';

export function createAuditWorker(): Worker {
  const connection = { host: queueConfig.redis.host, port: queueConfig.redis.port };

  const worker = new Worker(
    'audit',
    async (job) => {
      const { event, accountId, details } = job.data;
      logger.info({ event, accountId, details }, 'Audit event');
    },
    {
      connection,
      concurrency: 5,
    },
  );

  return worker;
}
