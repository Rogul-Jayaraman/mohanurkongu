import { prisma } from '../database/prisma.js';
import { appConfig } from '../config/app.config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const BATCH = 100;
const HOURS = 24;

async function run() {
  try {
    const cutoff = new Date(Date.now() - HOURS * 60 * 60 * 1000);
    const storageDir = appConfig.storageDir || path.join(process.cwd(), '..', 'storage');
    let total = 0;

    while (true) {
      const uploads = await prisma.upload.findMany({
        where: {
          status: 'TEMP',
          updatedAt: { lt: cutoff },
        },
        take: BATCH,
      });

      if (uploads.length === 0) break;

      for (const upload of uploads) {
        if (!upload.objectKey) continue;
        const filePath = path.join(storageDir, upload.objectKey);
        try {
          await fs.unlink(filePath);
        } catch {
          // file may not exist
        }
      }

      await prisma.upload.updateMany({
        where: { id: { in: uploads.map((u) => u.id) } },
        data: { status: 'DELETED' },
      });

      total += uploads.length;
    }

    if (total > 0) {
      const { logger } = await import('../common/utils/logger.js');
      logger.info(`Cleaned ${total} temp uploads`);
    }
  } catch (err) {
    const { logger } = await import('../common/utils/logger.js');
    logger.error({ err }, 'cleanup-temp-uploads job failed');
  }
}

const interval = setInterval(run, 60 * 60 * 1000);
run();

process.on('SIGTERM', () => clearInterval(interval));
process.on('SIGINT', () => clearInterval(interval));
