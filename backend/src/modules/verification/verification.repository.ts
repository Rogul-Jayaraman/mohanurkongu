import { prisma } from '../../database/prisma.js';
import type { VerificationType, VerificationPurpose, VerificationState } from '@prisma/client';

export interface UpsertVerificationData {
  type: VerificationType;
  target: string;
  otpHash: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
  maxAttempts?: number;
}

export class VerificationRepository {
  async upsert(data: UpsertVerificationData) {
    const existing = await prisma.accountVerification.findFirst({
      where: {
        type: data.type,
        target: data.target,
        purpose: data.purpose,
        state: { in: ['PENDING', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return prisma.accountVerification.update({
        where: { id: existing.id },
        data: {
          otpHash: data.otpHash,
          expiresAt: data.expiresAt,
          state: 'PENDING',
          attempts: 0,
          maxAttempts: data.maxAttempts ?? 5,
          consumedAt: null,
        },
      });
    }

    return prisma.accountVerification.create({
      data: {
        type: data.type,
        target: data.target,
        otpHash: data.otpHash,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        state: 'PENDING',
        maxAttempts: data.maxAttempts ?? 5,
      },
    });
  }

  async findLatest(target: string, purpose: VerificationPurpose) {
    return prisma.accountVerification.findFirst({
      where: {
        target,
        purpose,
        state: { in: ['PENDING', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async transitionState(id: string, state: VerificationState) {
    const data: any = { state };
    if (state === 'VERIFIED') {
      data.consumedAt = new Date();
    }
    if (state === 'ARCHIVED') {
      data.archivedAt = new Date();
    }
    return prisma.accountVerification.update({
      where: { id },
      data,
    });
  }

  async incrementAttempts(id: string, currentAttempts: number) {
    return prisma.accountVerification.update({
      where: { id },
      data: { attempts: currentAttempts + 1 },
    });
  }

  async expirePending() {
    const result = await prisma.accountVerification.updateMany({
      where: {
        state: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { state: 'EXPIRED' },
    });
    return result.count;
  }

  async archiveOld(afterDays: number) {
    const cutoff = new Date(Date.now() - afterDays * 24 * 60 * 60 * 1000);
    const result = await prisma.accountVerification.updateMany({
      where: {
        state: { in: ['EXPIRED', 'VERIFIED', 'CANCELLED'] },
        updatedAt: { lt: cutoff },
      },
      data: { state: 'ARCHIVED', archivedAt: new Date() },
    });
    return result.count;
  }

  async purgeArchived(afterDays: number) {
    const cutoff = new Date(Date.now() - afterDays * 24 * 60 * 60 * 1000);
    const result = await prisma.accountVerification.deleteMany({
      where: {
        state: 'ARCHIVED',
        archivedAt: { lt: cutoff },
      },
    });
    return result.count;
  }

  async findRecent(target: string, purpose: VerificationPurpose, withinMs: number) {
    const since = new Date(Date.now() - withinMs);
    return prisma.accountVerification.findFirst({
      where: {
        target,
        purpose,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countResends(target: string, purpose: VerificationPurpose, withinMs: number) {
    const since = new Date(Date.now() - withinMs);
    return prisma.accountVerification.count({
      where: {
        target,
        purpose,
        createdAt: { gte: since },
      },
    });
  }
}
