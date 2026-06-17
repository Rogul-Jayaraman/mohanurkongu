import type { PrismaClient, UploadStatus } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomInt, randomDateBefore, randomDateAfter,
  generatePublicId, generateUploadToken, generateChecksum,
  pickRandom, randomBool, weightedPick, progressBar,
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

export interface UploadIndex {
  byAccount: Map<string, { profile: string[]; gallery: string[]; horoscope: string[] }>;
  total: number;
}

function randomSize(status: string): number {
  switch (status) {
    case 'TEMP': return randomInt(5000, 100000);
    case 'ACTIVE': return randomInt(50000, 2000000);
    case 'ATTACHED': return randomInt(30000, 500000);
    case 'DELETE_PENDING': return randomInt(50000, 800000);
    default: return randomInt(1000, 100000);
  }
}

export async function seedUploads(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
): Promise<UploadIndex> {
  const accountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);
  const byAccount = new Map<string, { profile: string[]; gallery: string[]; horoscope: string[] }>();
  for (const aid of accountIds) {
    byAccount.set(aid, { profile: [], gallery: [], horoscope: [] });
  }

  let totalUploads = 0;
  for (const def of UPLOAD_COMPOSITION) totalUploads += def.count;
  let created = 0;

  for (const def of UPLOAD_COMPOSITION) {
    for (let i = 0; i < def.count; i++) {
      const ownerId = pickRandom(accountIds);
      const mimeIdx = randomInt(0, MIME_TYPES.length - 1);
      const dims = (def.status === 'ACTIVE' || def.status === 'ATTACHED')
        ? pickRandom([
            { w: 400, h: 500 }, { w: 800, h: 1000 }, { w: 1200, h: 1500 },
            { w: 600, h: 600 }, { w: 200, h: 300 }, { w: 1920, h: 2560 },
          ])
        : { w: 0, h: 0 };
      const now = new Date();
      const createdAt = def.status === 'TEMP'
        ? randomDateBefore(now, 7)
        : randomDateBefore(now, 90);

      const uploadType = weightedPick([
        { value: 'profile_photo', weight: 35 },
        { value: 'gallery_photo', weight: 40 },
        { value: 'horoscope_chart', weight: 10 },
        { value: 'temp', weight: 15 },
      ]);

      const isUsable = def.status === 'ACTIVE' || def.status === 'ATTACHED';

      const folder = uploadType === 'profile_photo' ? 'profiles'
        : uploadType === 'gallery_photo' ? 'gallery'
        : uploadType === 'horoscope_chart' ? 'horoscope'
        : 'temp';

      const upload = await prisma.upload.create({
        data: {
          uploadToken: def.status !== 'DELETED' ? generateUploadToken() : null,
          ownerAccountId: ownerId,
          objectKey: `${folder}/${ownerId}/${generatePublicId()}.${EXTENSIONS[mimeIdx]}`,
          originalFileName: `photo_${generatePublicId()}.${EXTENSIONS[mimeIdx]}`,
          mimeType: MIME_TYPES[mimeIdx],
          size: randomSize(def.status),
          checksum: generateChecksum(),
          status: def.status,
          version: 1,
          width: dims.w > 0 ? dims.w : null,
          height: dims.h > 0 ? dims.h : null,
          createdAt,
          updatedAt: def.status === 'ACTIVE'
            ? randomDateAfter(createdAt, 30)
            : createdAt,
          deletedAt: def.status === 'DELETED' ? new Date() : null,
        },
      });

      if (isUsable) {
        const entry = byAccount.get(ownerId) || byAccount.values().next().value;
        if (uploadType === 'profile_photo') entry.profile.push(upload.id);
        else if (uploadType === 'gallery_photo') entry.gallery.push(upload.id);
        else if (uploadType === 'horoscope_chart') entry.horoscope.push(upload.id);
      }

      created++;
      progressBar(created, totalUploads, 'Uploads');
    }
  }

  return { byAccount, total: totalUploads };
}
