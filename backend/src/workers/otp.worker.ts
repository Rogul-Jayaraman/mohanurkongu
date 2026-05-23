import { Worker } from 'bullmq';
import { queueConfig } from '../config/queue.config.js';

export function createOtpWorker(): Worker {
  const connection = { host: queueConfig.redis.host, port: queueConfig.redis.port };

  const worker = new Worker(
    'otp',
    async (job) => {
      const { email, otp, purpose } = job.data;
      console.log(`[OTP Worker] ${purpose} OTP for ${email}: ${otp}`);

      await job.updateProgress(100);
    },
    {
      connection,
      concurrency: 10,
    },
  );

  return worker;
}
