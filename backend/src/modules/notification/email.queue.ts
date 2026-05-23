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
  'email-verification': 'மின்னஞலைச் சரிபார்க்க / Verify Your Email',
  'login-otp': 'உங்கள் உள்நுழைவுக் குறியீடு / Your Login Code',
  'password-reset': 'கடவுச்சொல்லை மீட்டமை / Reset Your Password',
  'security-alert': 'பாதுகாப்பு எச்சரிக்கை / Security Alert',
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

export async function enqueueOtpEmail(to: string, otp: string, purpose: string): Promise<void> {
  if (purpose === 'REGISTER') {
    await enqueueTemplateEmail('email-verification', {
      to,
      verifyUrl: '',
      unsubscribeUrl: '',
    });
  } else {
    await enqueueTemplateEmail('password-reset', {
      to,
      resetUrl: '',
      unsubscribeUrl: '',
    });
  }
}

export async function enqueueWelcomeEmail(to: string, name: string): Promise<void> {
  await enqueueTemplateEmail('welcome', {
    to,
    name,
    profileUrl: '',
    exploreUrl: '',
    unsubscribeUrl: '',
  });
}

export { SUBJECT_MAP };
export type { EmailTemplate };
