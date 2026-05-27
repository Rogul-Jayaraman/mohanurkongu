import { prisma } from '../src/database/prisma.js';
import { generatePublicId } from '../src/modules/upload/public-id.helper.js';
const generateUploadToken = generatePublicId;

async function backfill() {
  const BATCH_SIZE = 1000;
  let total = 0;
  let failed = 0;
  let remaining = 0;

  const pendingCount = await prisma.upload.count({ where: { uploadToken: null } });
  console.log(`Found ${pendingCount} uploads without uploadToken`);

  do {
    const batch = await prisma.upload.findMany({
      where: { uploadToken: null },
      take: BATCH_SIZE,
      select: { id: true },
    });

    if (batch.length === 0) break;

    for (const upload of batch) {
      try {
        await prisma.upload.update({
          where: { id: upload.id },
          data: { uploadToken: generateUploadToken() },
        });
        total++;
      } catch (err) {
        failed++;
        console.error(`Failed to update upload ${upload.id}:`, err);
      }
    }

    remaining = await prisma.upload.count({ where: { uploadToken: null } });
    console.log(`Processed: ${total}, Failed: ${failed}, Remaining: ${remaining}`);
  } while (remaining > 0);

  console.log(`Backfill complete. Processed: ${total}, Failed: ${failed}`);
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

  