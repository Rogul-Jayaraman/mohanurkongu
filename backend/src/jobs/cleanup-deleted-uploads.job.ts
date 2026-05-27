import { prisma } from '../database/prisma.js';
import { appConfig } from '../config/app.config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const BATCH = 100;
const GRACE_HOURS = 48;
const MAX_ATTEMPTS = 5;

async function run() {
  try {
    const cutoff = new Date(Date.now() - GRACE_HOURS * 60 * 60 * 1000);
    const storageDir = appConfig.storageDir || path.join(process.cwd(), '..', 'storage');
    let total = 0;

    while (true) {
      const uploads = await prisma.upload.findMany({
        where: {
          status: 'DELETE_PENDING',
          updatedAt: { lt: cutoff },
          cleanupAbandonedAt: null,
          cleanupAttempts: { lt: MAX_ATTEMPTS },
        },
        take: BATCH,
      });

      if (uploads.length === 0) break;

      for (const upload of uploads) {
        try {
          if (upload.objectKey) {
            const filePath = path.join(storageDir, upload.objectKey);
            await fs.unlink(filePath).catch(() => {});
          }

          await prisma.upload.update({
            where: { id: upload.id },
            data: {
              status: 'DELETED',
              deletedAt: new Date(),
            },
          });
        } catch (err: any) {
          const attempts = upload.cleanupAttempts + 1;
          const data: any = {
            cleanupAttempts: attempts,
            cleanupLastError: err.message || 'Unknown error',
          };
          if (attempts >= MAX_ATTEMPTS) {
            data.cleanupAbandonedAt = new Date();
          }
          await prisma.upload.update({ where: { id: upload.id }, data }).catch(() => {});
        }
      }

      total += uploads.length;
    }

    if (total > 0) {
      const { logger } = await import('../common/utils/logger.js');
      logger.info(`Cleaned ${total} deleted uploads`);
    }
  } catch (err) {
    const { logger } = await import('../common/utils/logger.js');
    logger.error({ err }, 'cleanup-deleted-uploads job failed');
  }
}

const interval = setInterval(run, 30 * 60 * 1000);
run();

process.on('SIGTERM', () => clearInterval(interval));
process.on('SIGINT', () => clearInterval(interval));
