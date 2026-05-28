import type { PrismaClient, UploadStatus } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomInt, randomDateBefore, randomDateAfter,
  generatePublicId, generateUploadToken, generateChecksum,
  pickRandom, randomBool, pickNRandom, shuffleArray, progressBar,
} from '../helpers.js';

const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const EXTENSIONS = ['jpg', 'png', 'webp', 'heic'];

interface UploadDefinition {
  status: UploadStatus;
  count: number;
}

const UPLOAD_COMPOSITION: UploadDefinition[] = [
  { status: 'TEMP', count: SEED_CONFIG.UPLOAD_DISTRIBUTION.TEMP },
  { status: 'ATTACHED', count: SEED_CONFIG.UPLOAD_DISTRIBUTION.ATTACHED },
  { status: 'ACTIVE', count: SEED_CONFIG.UPLOAD_DISTRIBUTION.ACTIVE },
  { status: 'DELETE_PENDING', count: SEED_CONFIG.UPLOAD_DISTRIBUTION.DELETE_PENDING },
  { status: 'DELETED', count: SEED_CONFIG.UPLOAD_DISTRIBUTION.DELETED },
];

function randomSize(status: string): number {
  if (status === 'TEMP') return randomInt(5000, 50000);
  if (status === 'ACTIVE') return randomInt(20000, 500000);
  if (status === 'ATTACHED') return randomInt(10000, 200000);
  if (status === 'DELETE_PENDING') return randomInt(30000, 400000);
  return randomInt(1000, 100000);
}

function randomDimensions(): { w: number; h: number } {
  const ratios = [
    { w: 400, h: 500 }, { w: 800, h: 1000 }, { w: 1200, h: 1500 },
    { w: 600, h: 600 }, { w: 200, h: 300 }, { w: 1024, h: 768 },
  ];
  return pickRandom(ratios);
}

export async function seedUploads(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
): Promise<string[]> {
  const allUploadIds: string[] = [];
  const accountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);
  let totalUploads = 0;
  const uploadDefs = UPLOAD_COMPOSITION;

  for (const def of uploadDefs) {
    totalUploads += def.count;
  }

  let created = 0;

  for (const def of uploadDefs) {
    const batchSize = 50;

    for (let b = 0; b < def.count; b += batchSize) {
      const batch = Math.min(batchSize, def.count - b);
      const data: any[] = [];

      for (let j = 0; j < batch; j++) {
        const ownerId = pickRandom(accountIds);
        const mimeIdx = randomInt(0, MIME_TYPES.length - 1);
        const dims = def.status === 'ACTIVE' || def.status === 'ATTACHED' ? randomDimensions() : { w: 0, h: 0 };
        const now = new Date();
        const createdAt = randomDateBefore(now, 60);

        let timestamps: any = { createdAt, updatedAt: createdAt };
        if (def.status === 'ACTIVE') {
          timestamps.updatedAt = randomDateAfter(createdAt, 30);
        }

        const upload: any = {
          publicId: generatePublicId(),
          uploadToken: generateUploadToken(),
          ownerAccountId: ownerId,
          objectKey: `profiles/${ownerId}/${generatePublicId()}.${EXTENSIONS[mimeIdx]}`,
          originalFileName: `photo_${generatePublicId()}.${EXTENSIONS[mimeIdx]}`,
          mimeType: MIME_TYPES[mimeIdx],
          extension: EXTENSIONS[mimeIdx],
          size: randomSize(def.status),
          checksum: generateChecksum(),
          status: def.status,
          version: 1,
          width: dims.w > 0 ? dims.w : null,
          height: dims.h > 0 ? dims.h : null,
          ...timestamps,
        };

        if (def.status === 'DELETED') {
          upload.deletedAt = new Date();
        }

        data.push(upload);
      }

      for (const d of data) {
        await prisma.upload.create({ data: d });
        created++;
        allUploadIds.push('');
        progressBar(created, totalUploads, 'Uploads');
      }
    }
  }

  const allUploads = await prisma.upload.findMany({
    where: { status: { in: ['ACTIVE', 'ATTACHED'] } },
    select: { id: true, status: true, ownerAccountId: true },
  });

  const result = allUploads.map(u => u.id);
  return result;
}

export async function getUploadsByOwner(
  prisma: PrismaClient,
  accountId: string,
  status?: string,
): Promise<any[]> {
  const where: any = { ownerAccountId: accountId };
  if (status) where.status = status;
  return prisma.upload.findMany({ where, select: { id: true, status: true } });
}
