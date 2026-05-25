import { prisma } from '../../database/prisma.js';

export class StorageRepository {
  async findById(id: string) {
    return prisma.upload.findUnique({ where: { id } });
  }

  async findByAccountId(accountId: string) {
    return prisma.upload.findMany({ where: { ownerAccountId: accountId } });
  }

  async findByIdsAndOwner(ids: string[], accountId: string) {
    return prisma.upload.findMany({
      where: { id: { in: ids }, ownerAccountId: accountId },
    });
  }

  async findByOwnerAndChecksum(accountId: string, checksum: string) {
    return prisma.upload.findFirst({
      where: { ownerAccountId: accountId, checksum, status: 'TEMP' },
    });
  }

  async create(data: {
    publicId: string;
    ownerAccountId: string;
    objectKey: string;
    originalFileName: string;
    mimeType: string;
    extension: string;
    size: number;
    checksum: string;
  }) {
    return prisma.upload.create({ data });
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

  async updateLastAccessed(id: string): Promise<void> {
    await prisma.upload.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    }).catch(() => {});
  }

  async deleteMany(ids: string[]) {
    return prisma.upload.deleteMany({ where: { id: { in: ids } } });
  }

  async findTempOlderThan(hours: number) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.upload.findMany({
      where: { status: 'TEMP', updatedAt: { lt: cutoff } },
    });
  }

  async findDraftUploadsByProfileId(profileId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        photo: {
          select: {
            primaryUpload: true,
            gallery: { select: { upload: true } },
          },
        },
        horoscope: {
          select: {
            rasiChart: true,
            navamsaChart: true,
          },
        },
      },
    });

    if (!profile) return [];

    const uploads: any[] = [];
    if (profile.photo?.primaryUpload) uploads.push(profile.photo.primaryUpload);
    if (profile.photo?.gallery) {
      for (const g of profile.photo.gallery) {
        if (g.upload) uploads.push(g.upload);
      }
    }
    if (profile.horoscope?.rasiChart) uploads.push(profile.horoscope.rasiChart);
    if (profile.horoscope?.navamsaChart) uploads.push(profile.horoscope.navamsaChart);

    return uploads.filter((u) => u.status === 'DRAFT');
  }
}
