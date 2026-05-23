import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { queueConfig } from '../config/queue.config.js';
import { logger } from '../common/utils/logger.js';
import { maskEmail } from '../common/utils/mask.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      transporter = nodemailer.createTransport({
        host: queueConfig.email.host,
        port: queueConfig.email.port,
        secure: queueConfig.email.port === 465,
        auth: {
          user: queueConfig.email.user,
          pass: queueConfig.email.pass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: queueConfig.email.host,
        port: queueConfig.email.port,
        ignoreTLS: true,
      });
    }
  }
  return transporter;
}

export function createEmailWorker(): Worker {
  const connection = { host: queueConfig.redis.host, port: queueConfig.redis.port };

  const worker = new Worker(
    'email',
    async (job) => {
      const { to, subject, body } = job.data;
      logger.info({ to: maskEmail(to), subject }, 'Sending email');

      const transport = getTransporter();
      await transport.sendMail({
        from: queueConfig.email.from,
        to,
        subject,
        text: body,
      });

      logger.info({ to: maskEmail(to), subject }, 'Email sent');
    },
    {
      connection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 },
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Email job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Email job completed');
  });

  logger.info('Email worker initialized');
  return worker;
}
