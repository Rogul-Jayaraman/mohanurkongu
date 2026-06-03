import { Worker } from 'bullmq';
import { queueConfig } from '../config/queue.config.js';
import { logger } from '../common/utils/logger.js';
import { prisma } from '../database/prisma.js';

export function createAuditWorker(): Worker {
  const connection = { host: queueConfig.redis.host, port: queueConfig.redis.port };

  const worker = new Worker(
    'audit',
    async (job) => {
      const { event, accountId, details } = job.data;
      logger.info({ event, accountId, details }, 'Audit event');

      if (!accountId) {
        logger.warn({ event, details }, 'Audit event skipped: missing accountId');
        return;
      }

      try {
        await prisma.adminAuditEvent.create({
          data: {
            actorId: accountId,
            action: event,
            ipAddress: details?.ipAddress || null,
            profileId: details?.profileId || null,
          },
        });
      } catch (err) {
        logger.error({ err, event, accountId }, 'Failed to persist audit event');
      }
    },
    {
      connection,
      concurrency: 5,
    },
  );

  return worker;
}
