import { Queue } from 'bullmq';
import { queueConfig } from '../../config/queue.config.js';
import { logger } from '../../common/utils/logger.js';

let emailQueue: Queue | null = null;

export function getEmailQueue(): Queue {
  if (!emailQueue) {
    const connection = { host: queueConfig.redis.host, port: queueConfig.redis.port };

    emailQueue = new Queue('email', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    logger.info('Email queue initialized');
  }
  return emailQueue;
}

export async function enqueueEmail(to: string, subject: string, body: string): Promise<void> {
  const queue = getEmailQueue();
  await queue.add('send-email', {
    to,
    subject,
    body,
    createdAt: new Date().toISOString(),
  });
}

export async function enqueueOtpEmail(to: string, otp: string, purpose: string): Promise<void> {
  const subject = purpose === 'REGISTER' ? 'Your Registration OTP' : 'Your Password Reset OTP';
  const body = `Your OTP is: ${otp}. It expires in 5 minutes.`;
  await enqueueEmail(to, subject, body);
}

export async function enqueueWelcomeEmail(to: string, name: string): Promise<void> {
  await enqueueEmail(to, 'Welcome to Mohanur Kongu', `Welcome ${name}! Your account has been created.`);
}
