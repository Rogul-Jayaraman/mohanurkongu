import { prisma } from '../database/prisma.js';
import { appConfig } from '../config/app.config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const BATCH = 100;
const HOURS = 24;

async function run() {
  const cutoff = new Date(Date.now() - HOURS * 60 * 60 * 1000);
  const uploadDir = appConfig.uploadDir || path.join(process.cwd(), 'uploads');
  let total = 0;

  while (true) {
    const uploads = await prisma.upload.findMany({
      where: {
        status: 'TEMP',
        createdAt: { lt: cutoff },
        lastAccessedAt: { lt: cutoff },
      },
      take: BATCH,
    });

    if (uploads.length === 0) break;

    for (const upload of uploads) {
      const filePath = path.join(uploadDir, upload.objectKey);
      try {
        await fs.unlink(filePath);
      } catch {
        // file may not exist
      }
    }

    await prisma.upload.deleteMany({
      where: { id: { in: uploads.map((u) => u.id) } },
    });

    total += uploads.length;
  }

  if (total > 0) {
    const { logger } = await import('../common/utils/logger.js');
    logger.info(`Cleaned ${total} temp uploads`);
  }
}

const interval = setInterval(run, 60 * 60 * 1000);
run();

process.on('SIGTERM', () => clearInterval(interval));
process.on('SIGINT', () => clearInterval(interval));
