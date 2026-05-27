import { prisma } from '../../database/prisma.js';
import { generatePublicId } from '../upload/public-id.helper.js';

export class StorageRepository {
  async findById(id: string) {
    return prisma.upload.findUnique({ where: { id } });
  }

  async findByUploadToken(token: string) {
    return prisma.upload.findUnique({ where: { uploadToken: token } });
  }

  async findByAccountId(accountId: string) {
    return prisma.upload.findMany({ where: { ownerAccountId: accountId } });
  }

  async findByIdsAndOwner(ids: string[], accountId: string) {
    return prisma.upload.findMany({
      where: { id: { in: ids }, ownerAccountId: accountId },
    });
  }

  async create(data: {
    uploadToken: string;
    ownerAccountId: string;
    objectKey: string;
    size: number;
    checksum: string;
    status: string;
    width: number;
    height: number;
  }) {
    return prisma.upload.create({
      data: {
        publicId: generatePublicId(), // kept until Phase 10 cleanup
        uploadToken: data.uploadToken,
        ownerAccountId: data.ownerAccountId,
        objectKey: data.objectKey,
        originalFileName: '',
        mimeType: 'image/webp',
        extension: 'webp',
        size: data.size,
        checksum: data.checksum,
        status: data.status as any,
        width: data.width,
        height: data.height,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.upload.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async bulkUpdateStatus(ids: string[], status: string, currentStatuses?: string[], tx?: any) {
    const client = tx ?? prisma;
    return client.upload.updateMany({
      where: {
        id: { in: ids },
        ...(currentStatuses && currentStatuses.length > 0 ? { status: { in: currentStatuses as any } } : {}),
      },
      data: { status: status as any },
    });
  }

  async deleteMany(ids: string[]) {
    return prisma.upload.deleteMany({ where: { id: { in: ids } } });
  }

  async findTempOlderThan(hours: number) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.upload.findMany({
      where: { status: 'TEMP', createdAt: { lt: cutoff } },
    });
  }

  // ── v9.0 Cleanup helpers ──────────────────────────────────────

  async findExpiredTemp(hours: number) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.upload.findMany({
      where: { status: 'TEMP', createdAt: { lt: cutoff } },
      take: 100,
    });
  }

  async findExpiredDraftProfiles(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.profile.findMany({
      where: { currentStatus: 'DRAFT', updatedAt: { lt: cutoff } },
      take: 100,
      include: {
        photo: { include: { gallery: true } },
        horoscope: true,
      },
    });
  }

  async findDeletePendingBatch(limit: number) {
    return prisma.upload.findMany({
      where: {
        status: 'DELETE_PENDING',
        cleanupAbandonedAt: null,
        cleanupAttempts: { lt: 5 },
      },
      take: limit,
    });
  }

  async updateCleanupFailure(id: string, attempts: number, error: string) {
    const data: any = {
      cleanupAttempts: attempts,
      cleanupLastError: error,
    };
    if (attempts >= 5) {
      data.cleanupAbandonedAt = new Date();
    }
    return prisma.upload.update({ where: { id }, data });
  }

  async markDeleted(id: string) {
    return prisma.upload.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }
}
