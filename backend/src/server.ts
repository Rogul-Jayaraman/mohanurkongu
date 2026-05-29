import { createApp } from './app.js';
import { prisma } from './database/prisma.js';
import { logger } from './common/utils/logger.js';
import { queueConfig } from './config/queue.config.js';
import { createEmailWorker } from './workers/email.worker.js';
import { createOtpWorker } from './workers/otp.worker.js';
import { createAuditWorker } from './workers/audit.worker.js';
import { expireMemberships } from './jobs/expire-membership.job.js';
import { expireVerifications } from './jobs/expire-verification.job.js';
import { archiveVerifications } from './jobs/archive-verification.job.js';
import { purgeVerifications } from './jobs/purge-verification.job.js';
import { runSessionExpiry } from './jobs/expire-session.job.js';
import { expireRegistrationSessions, expireResetSessions } from './jobs/expire-registration.job.js';
import { authConfig } from './config/auth.config.js';

async function bootstrap() {
  const app = createApp();
  const server = app.listen(app.get('port') || 4000, '0.0.0.0', () => {
    logger.info({ port: 4000, env: process.env.NODE_ENV }, 'Server started');
  });

  await prisma.$connect();
  logger.info('Database connected');

  logger.info({ host: queueConfig.redis.host, port: queueConfig.redis.port }, 'Redis config loaded');

  const emailWorker = createEmailWorker();
  const otpWorker = createOtpWorker();
  const auditWorker = createAuditWorker();

  const expireInterval = setInterval(
    () => expireVerifications().catch((e) => logger.error({ err: e }, 'Expire verifications failed')),
    authConfig.jobs.expireIntervalMs,
  );

  const archiveInterval = setInterval(
    () => archiveVerifications().catch((e) => logger.error({ err: e }, 'Archive verifications failed')),
    authConfig.jobs.archiveIntervalMs,
  );

  const purgeInterval = setInterval(
    () => purgeVerifications().catch((e) => logger.error({ err: e }, 'Purge verifications failed')),
    authConfig.jobs.purgeIntervalMs,
  );

  const sessionInterval = setInterval(
    () => runSessionExpiry().catch((e) => logger.error({ err: e }, 'Session expiry failed')),
    authConfig.session.cleanupIntervalMinutes * 60 * 1000,
  );

  const regExpireInterval = setInterval(
    () => {
      expireRegistrationSessions().catch((e) => logger.error({ err: e }, 'Registration expire failed'));
      expireResetSessions().catch((e) => logger.error({ err: e }, 'Reset expire failed'));
    },
    60_000,
  );

  const membershipExpireInterval = setInterval(
    () => expireMemberships().catch((e) => logger.error({ err: e }, 'Membership expiry failed')),
    60_000,
  );

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      clearInterval(expireInterval);
      clearInterval(archiveInterval);
      clearInterval(purgeInterval);
      clearInterval(sessionInterval);
      clearInterval(regExpireInterval);
      clearInterval(membershipExpireInterval);

      logger.info('Shutting down workers...');
      await Promise.allSettled([
        emailWorker.close(true),
        otpWorker.close(true),
        auditWorker.close(true),
      ]);

      const { getEmailQueue } = await import('./modules/notification/email.queue.js');
      try {
        await getEmailQueue().close();
      } catch { /* ok */ }

      await prisma.$disconnect();

      logger.info('Server shut down gracefully');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
