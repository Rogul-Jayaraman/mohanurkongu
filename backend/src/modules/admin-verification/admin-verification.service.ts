import type { AdminVerificationRepository } from './admin-verification.repository.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { prisma } from '../../database/prisma.js';
import type { StorageService } from '../storage/storage.service.js';

export class AdminVerificationService {
  constructor(
    private readonly repo: AdminVerificationRepository,
    private readonly storageService?: StorageService,
  ) {}

  async getQueue(params: { page: number; limit: number; search?: string }) {
    return this.repo.findPendingProfiles(params);
  }

  async approveProfile(adminId: string, profileId: string, ipAddress?: string) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, currentStatus: 'PENDING' },
    });

    if (!profile) {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, ErrorCodes.PROFILE_WRONG_STATUS);
    }

    if (profile.accountId === adminId) {
      throw new AppError(403, ErrorCodes.AUTH_FORBIDDEN, 'SELF_APPROVAL_NOT_ALLOWED');
    }

    const queueEntry = await prisma.verificationQueue.findUnique({ where: { profileId } });
    if (!queueEntry) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'VERIFICATION_QUEUE_ENTRY_MISSING');
    }
    if (queueEntry.completedAt) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'VERIFICATION_ALREADY_COMPLETED');
    }

    return prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          currentStatus: 'ACTIVE',
          activatedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: 'PENDING',
          toStatus: 'ACTIVE',
        },
      });

      await tx.profileReview.create({
        data: {
          profileId,
          reviewerId: adminId,
          action: 'APPROVED',
        },
      });

      await tx.verificationQueue.upsert({
        where: { profileId },
        create: { profileId, completedAt: new Date() },
        update: { completedAt: new Date() },
      });

      const fullProfile = await tx.profile.findUnique({
        where: { id: profileId },
        include: {
          photo: { include: { gallery: true } },
          horoscope: true,
        },
      });

      if (fullProfile) {
        const uploadIds: string[] = [];
        if (fullProfile.photo?.primaryUploadId) uploadIds.push(fullProfile.photo.primaryUploadId);
        if (fullProfile.photo?.gallery) uploadIds.push(...fullProfile.photo.gallery.map((g: any) => g.uploadId));
        if (fullProfile.horoscope?.rasiChartUploadId) uploadIds.push(fullProfile.horoscope.rasiChartUploadId);
        if (fullProfile.horoscope?.navamsaChartUploadId) uploadIds.push(fullProfile.horoscope.navamsaChartUploadId);
        const uniqueIds = [...new Set(uploadIds)];
        if (uniqueIds.length > 0) {
          await this.storageService!.bulkTransitionStatus(uniqueIds, ['ATTACHED'], 'ACTIVE', tx);
        }
      }

      await tx.adminAuditEvent.create({
        data: {
          actorId: adminId,
          profileId,
          action: 'PROFILE_APPROVED',
          ipAddress: ipAddress || null,
        },
      });

      return { profileId, status: 'ACTIVE' };
    });
  }

  async rejectProfile(
    adminId: string,
    profileId: string,
    dto: { reasonEn: string; reasonTa?: string },
    ipAddress?: string,
  ) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, currentStatus: 'PENDING' },
    });

    if (!profile) {
      throw new AppError(400, ErrorCodes.PROFILE_WRONG_STATUS, ErrorCodes.PROFILE_WRONG_STATUS);
    }

    const queueEntry = await prisma.verificationQueue.findUnique({ where: { profileId } });
    if (!queueEntry) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'VERIFICATION_QUEUE_ENTRY_MISSING');
    }
    if (queueEntry.completedAt) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'VERIFICATION_ALREADY_COMPLETED');
    }

    return prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          currentStatus: 'REJECTED',
          rejectionReasonEn: dto.reasonEn,
          rejectionReasonTa: dto.reasonTa || null,
          rejectedAt: new Date(),
          rejectedBy: adminId,
        },
      });

      await tx.profileStateHistory.create({
        data: {
          profileId,
          changedByAccountId: adminId,
          fromStatus: 'PENDING',
          toStatus: 'REJECTED',
        },
      });

      await tx.profileReview.create({
        data: {
          profileId,
          reviewerId: adminId,
          action: 'REJECTED',
          reasonEn: dto.reasonEn,
          reasonTa: dto.reasonTa || null,
        },
      });

      await tx.verificationQueue.upsert({
        where: { profileId },
        create: { profileId, completedAt: new Date() },
        update: { completedAt: new Date() },
      });

      await tx.adminAuditEvent.create({
        data: {
          actorId: adminId,
          profileId,
          action: 'PROFILE_REJECTED',
          ipAddress: ipAddress || null,
        },
      });

      return { profileId, status: 'REJECTED' };
    });
  }

  async getStats() {
    return this.repo.getQueueStats();
  }
}
