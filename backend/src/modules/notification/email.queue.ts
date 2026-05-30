import { Queue } from 'bullmq';
import { queueConfig } from '../../config/queue.config.js';
import { logger } from '../../common/utils/logger.js';
import type { EmailTemplate, TemplateEmailJob } from './email.types.js';

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

const SUBJECT_MAP: Record<EmailTemplate, string> = {
  welcome: 'வரவேற்கிறோம் / Welcome to Mohanur Kongu Manamaalai',
  'password-reset': 'கடவுச்சொல்லை மீட்டமை / Reset Your Password',
  'password-reset-otp': 'கடவுச்சொல்லை மீட்டமைக்கும் குறியீடு / Password Reset Code',
  'registration-otp': 'உங்கள் பதிவுக் குறியீடு / Your Registration Code',
};

export async function enqueueEmail(to: string, subject: string, body: string): Promise<void> {
  const queue = getEmailQueue();
  await queue.add('send-email', {
    to,
    subject,
    body,
    createdAt: new Date().toISOString(),
  });
}

export async function enqueueTemplateEmail<T extends EmailTemplate>(
  template: T,
  data: Record<string, unknown> & { to: string },
): Promise<void> {
  const queue = getEmailQueue();
  const jobData: TemplateEmailJob<T> = {
    template,
    data: data as unknown as TemplateEmailJob<T>['data'],
    createdAt: new Date().toISOString(),
  };
  await queue.add('send-template-email', jobData);
}

export { SUBJECT_MAP };
export type { EmailTemplate };
