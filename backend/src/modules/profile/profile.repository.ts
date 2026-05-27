import { prisma } from '../../database/prisma.js';
import type { ProfileStatus } from '@prisma/client';

export class ProfileRepository {
  async findFullById(profileId: string) {
    return prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        basic: true,
        community: true,
        professional: true,
        family: true,
        horoscope: true,
        photo: { include: { gallery: true } },
        assets: true,
        partnerPreference: {
          include: {
            heightMin: true,
            heightMax: true,
          },
        },
        translations: true,
        history: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async findPendingById(profileId: string) {
    return prisma.profile.findFirst({
      where: { id: profileId, currentStatus: 'PENDING' },
    });
  }

  async findProfileById(profileId: string) {
    return prisma.profile.findUnique({ where: { id: profileId } });
  }

  async findAllByAccountId(accountId: string) {
    return prisma.profile.findMany({
      where: { accountId, currentStatus: { not: 'DELETED' } },
      orderBy: { updatedAt: 'desc' },
      include: {
        basic: {
          include: {
            profileFor: true,
            height: true,
            currentLocation: { include: { district: true, taluk: true } },
            nativeLocation: { include: { district: true, taluk: true } },
          },
        },
        community: { include: { community: true, caste: true, kulam: true } },
        professional: { include: { jobSector: true } },
        family: true,
        photo: {
          include: {
            primaryUpload: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
          },
        },
        translations: true,
      },
    });
  }

  async findFullWithDetails(profileId: string) {
    return prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        basic: {
          include: {
            profileFor: true,
            height: true,
            currentLocation: { include: { district: true, taluk: true } },
            nativeLocation: { include: { district: true, taluk: true } },
          },
        },
        community: { include: { community: true, caste: true, kulam: true } },
        professional: { include: { jobSector: true } },
        family: true,
        horoscope: {
          include: {
            rasi: true,
            nakshatra: true,
            lagna: true,
            rasiChart: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
            navamsaChart: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
          },
        },
        photo: {
          include: {
            primaryUpload: { select: { uploadToken: true, objectKey: true, width: true, height: true } },
            gallery: { include: { upload: { select: { uploadToken: true, objectKey: true, width: true, height: true } } } },
          },
        },
        assets: true,
        partnerPreference: {
          include: {
            heightMin: true,
            heightMax: true,
          },
        },
        translations: true,
        history: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async findDraftById(tx: any, profileId: string, accountId: string) {
    return tx.profile.findFirst({
      where: { id: profileId, accountId, currentStatus: 'DRAFT' },
    });
  }

  async createProfile(tx: any, accountId: string, status: ProfileStatus) {
    return tx.profile.create({
      data: { accountId, currentStatus: status, visibility: 'PRIVATE' },
    });
  }

  async updateProfileStatus(profileId: string, status: string, regNo?: string) {
    const data: any = { currentStatus: status };
    if (regNo) data.regNo = regNo;
    if (status === 'ACTIVE') data.activatedAt = new Date();
    if (status === 'DELETED') data.archivedAt = new Date();
    return prisma.profile.update({ where: { id: profileId }, data });
  }

  async createStateHistory(profileId: string, accountId: string, fromStatus: string | null, toStatus: string, reason?: string) {
    return prisma.profileStateHistory.create({
      data: { profileId, changedByAccountId: accountId, fromStatus: fromStatus as any || null, toStatus: toStatus as any, reason },
    });
  }

  async deleteProfile(profileId: string) {
    return prisma.profile.delete({ where: { id: profileId } });
  }
}
