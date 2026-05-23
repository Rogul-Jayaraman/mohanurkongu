import { Worker } from 'bullmq';
import { queueConfig } from '../config/queue.config.js';
import { logger } from '../common/utils/logger.js';

export function createOtpWorker(): Worker {
  const connection = { host: queueConfig.redis.host, port: queueConfig.redis.port };

  const worker = new Worker(
    'otp',
    async (job) => {
      const { email, purpose } = job.data;
      logger.info({ purpose, email }, 'OTP generated');

      await job.updateProgress(100);
    },
    {
      connection,
      concurrency: 10,
    },
  );

  return worker;
}
