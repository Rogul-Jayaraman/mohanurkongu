import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { queueConfig } from '../config/queue.config.js';
import { logger } from '../common/utils/logger.js';
import { maskEmail } from '../common/utils/mask.js';
import { renderEmail, initRenderer } from '../modules/notification/email.renderer.js';
import { SUBJECT_MAP } from '../modules/notification/email.queue.js';
import type { EmailTemplate, TemplateEmailJob } from '../modules/notification/email.types.js';

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

function generatePlainTextFallback(template: EmailTemplate, data: Record<string, unknown>): string {
  switch (template) {
    case 'welcome':
      return `Welcome ${data.name || 'Guest'}! Your account has been created successfully. Complete your profile to get started.`;
    case 'email-verification':
      return `Verify your email by visiting: ${data.verifyUrl || 'the verification page'}. This link expires in 15 minutes.`;
    case 'login-otp':
      return `Your login code is: ${data.otpCode || '------'}. It expires in 5 minutes. Never share this code.`;
    case 'password-reset':
      return `Reset your password by visiting: ${data.resetUrl || 'the reset page'}. This link expires in 15 minutes.`;
    case 'security-alert':
      return `A new login was detected on your account. Device: ${data.deviceName || 'Unknown'}, Location: ${data.deviceLocation || 'Unknown'}, Time: ${data.deviceTime || 'Unknown'}.`;
    default:
      return 'Please view this email in an HTML-compatible client.';
  }
}

export function createEmailWorker(): Worker {
  const connection = { host: queueConfig.redis.host, port: queueConfig.redis.port };

  initRenderer();

  const worker = new Worker(
    'email',
    async (job) => {
      if (job.name === 'send-template-email') {
        const { template, data } = job.data as TemplateEmailJob;
        const subject = SUBJECT_MAP[template as EmailTemplate] || 'Notification from Mohanur Kongu';
        logger.info({ to: maskEmail(data.to as string), template, subject }, 'Sending template email');

        const html = renderEmail(template, data as unknown as Record<string, unknown>);
        const text = generatePlainTextFallback(template as EmailTemplate, data as unknown as Record<string, unknown>);

        const transport = getTransporter();
        await transport.sendMail({
          from: queueConfig.email.from,
          to: data.to as string,
          subject,
          text,
          html,
        });

        logger.info({ to: maskEmail(data.to as string), template, subject }, 'Template email sent');
      } else {
        const { to, subject, body } = job.data;
        logger.info({ to: maskEmail(to), subject }, 'Sending plain text email');

        const transport = getTransporter();
        await transport.sendMail({
          from: queueConfig.email.from,
          to,
          subject,
          text: body,
        });

        logger.info({ to: maskEmail(to), subject }, 'Plain text email sent');
      }
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
