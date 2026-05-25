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
        partnerPreference: true,
        translations: true,
        history: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async findDraftByAccountId(accountId: string) {
    return prisma.profile.findFirst({
      where: { accountId, currentStatus: 'DRAFT' },
      include: {
        basic: true,
        community: true,
        professional: true,
        family: true,
        horoscope: true,
        photo: { include: { gallery: true } },
        assets: true,
        partnerPreference: true,
        translations: true,
      },
    });
  }

  async findActiveByAccountId(accountId: string) {
    return prisma.profile.findFirst({
      where: { accountId, currentStatus: 'ACTIVE' },
    });
  }

  async ensureProfile(tx: any, accountId: string, status: ProfileStatus) {
    return tx.profile.upsert({
      where: { accountId },
      create: { accountId, currentStatus: status, visibility: 'PRIVATE' },
      update: { currentStatus: status, updatedAt: new Date() },
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
