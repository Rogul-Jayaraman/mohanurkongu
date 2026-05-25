import { prisma } from '../database/prisma.js';
import { appConfig } from '../config/app.config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const BATCH = 100;
const DAYS = 30;

async function run() {
  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const uploadDir = appConfig.uploadDir || path.join(process.cwd(), 'uploads');
  let total = 0;

  while (true) {
    const drafts = await prisma.profile.findMany({
      where: {
        currentStatus: 'DRAFT',
        updatedAt: { lt: cutoff },
      },
      take: BATCH,
      include: {
        photo: { include: { gallery: true } },
        horoscope: true,
      },
    });

    if (drafts.length === 0) break;

    for (const profile of drafts) {
      const uploadIds: string[] = [];
      if (profile.photo?.primaryUploadId) uploadIds.push(profile.photo.primaryUploadId);
      if (profile.photo?.gallery) uploadIds.push(...profile.photo.gallery.map((g) => g.uploadId));
      if (profile.horoscope?.rasiChartUploadId) uploadIds.push(profile.horoscope.rasiChartUploadId);
      if (profile.horoscope?.navamsaChartUploadId) uploadIds.push(profile.horoscope.navamsaChartUploadId);

      const uniqueIds = [...new Set(uploadIds)];
      const uploads = uniqueIds.length > 0
        ? await prisma.upload.findMany({ where: { id: { in: uniqueIds } } })
        : [];

      for (const upload of uploads) {
        const filePath = path.join(uploadDir, upload.objectKey);
        try {
          await fs.unlink(filePath);
        } catch {
          // file may not exist
        }
      }

      await prisma.$transaction(async (tx) => {
        if (uniqueIds.length > 0) {
          await tx.upload.deleteMany({ where: { id: { in: uniqueIds } } });
        }
        await tx.profile.delete({ where: { id: profile.id } });
      });

      total++;
    }
  }

  if (total > 0) {
    const { logger } = await import('../common/utils/logger.js');
    logger.info(`Cleaned ${total} draft profiles`);
  }
}

const interval = setInterval(run, 24 * 60 * 60 * 1000);
run();

process.on('SIGTERM', () => clearInterval(interval));
process.on('SIGINT', () => clearInterval(interval));
