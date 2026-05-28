import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomDate, randomDateAfter, randomDateBefore,
  randomInt, pickRandom, weightedPickRaw, progressBar,
} from '../helpers.js';

export async function seedVerificationAndAudit(
  prisma: PrismaClient,
  profileIndex: Record<string, any>,
  adminAccountIds: string[],
): Promise<void> {
  const adminId = adminAccountIds[0] || 'seed-admin-placeholder';

  const pendingProfiles = Object.values(profileIndex).filter(
    (pi: any) => pi.status === 'PENDING',
  ) as any[];

  const activeProfiles = Object.values(profileIndex).filter(
    (pi: any) => pi.status === 'ACTIVE',
  ) as any[];

  const rejectedProfiles = Object.values(profileIndex).filter(
    (pi: any) => pi.status === 'REJECTED',
  ) as any[];

  const totalOps = pendingProfiles.length + activeProfiles.length + rejectedProfiles.length;
  let done = 0;

  for (const pi of pendingProfiles) {
    await prisma.verificationQueue.create({
      data: {
        profileId: pi.profile.id,
        priority: randomInt(0, 5),
        createdAt: randomDateBefore(new Date(), 7),
      },
    });
    done++;
    progressBar(done, totalOps, 'Verification');
  }

  for (const pi of activeProfiles) {
    const approvedAt = pi.profile.approvedAt || randomDateAfter(pi.profile.createdAt, 14);

    await prisma.verificationQueue.create({
      data: {
        profileId: pi.profile.id,
        assignedTo: adminId,
        completedAt: approvedAt,
        createdAt: randomDateBefore(approvedAt, 7),
        updatedAt: approvedAt,
      },
    });

    await prisma.profileReview.create({
      data: {
        profileId: pi.profile.id,
        reviewerId: adminId,
        action: 'APPROVED',
        createdAt: approvedAt,
      },
    });

    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action: 'PROFILE_APPROVED',
        createdAt: approvedAt,
      },
    });

    done++;
    progressBar(done, totalOps, 'Verification');
  }

  for (const pi of rejectedProfiles) {
    const rejectedAt = pi.profile.rejectedAt || randomDateAfter(pi.profile.createdAt, 7);

    await prisma.verificationQueue.create({
      data: {
        profileId: pi.profile.id,
        assignedTo: adminId,
        completedAt: rejectedAt,
        createdAt: randomDateBefore(rejectedAt, 3),
        updatedAt: rejectedAt,
      },
    });

    await prisma.profileReview.create({
      data: {
        profileId: pi.profile.id,
        reviewerId: adminId,
        action: 'REJECTED',
        reasonEn: pi.profile.rejectionReasonEn || 'Profile does not meet guidelines',
        reasonTa: pi.profile.rejectionReasonTa || 'சுயவிவரம் வழிகாட்டுதல்களை பூர்த்தி செய்யவில்லை',
        createdAt: rejectedAt,
      },
    });

    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action: 'PROFILE_REJECTED',
        createdAt: rejectedAt,
      },
    });

    done++;
    progressBar(done, totalOps, 'Verification');
  }
}

export async function seedAdditionalAuditEvents(
  prisma: PrismaClient,
  profileIndex: Record<string, any>,
  adminAccountIds: string[],
  targetCount: number,
): Promise<void> {
  const adminId = adminAccountIds[0] || 'seed-admin-placeholder';
  const allProfiles = Object.values(profileIndex) as any[];
  const archiveProfiles = allProfiles.filter(p => p.status === 'ARCHIVED');
  const deleteProfiles = allProfiles.filter(p => p.status === 'DELETED');
  const activeProfiles = allProfiles.filter(p => p.status === 'ACTIVE');

  let count = 0;

  for (const pi of archiveProfiles) {
    const archivedAt = pi.profile.archivedAt || new Date();
    await prisma.profile.update({
      where: { id: pi.profile.id },
      data: { archiveReasonEn: pickRandom(SEED_CONFIG.ARCHIVE_REASONS) },
    });
    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action: 'PROFILE_ARCHIVED',
        createdAt: archivedAt,
      },
    });
    count++;
  }

  for (const pi of deleteProfiles) {
    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action: 'PROFILE_DELETED',
        createdAt: pi.profile.archivedAt || new Date(),
      },
    });
    count++;
  }

  const auditActions = ['ACCOUNT_SUSPENDED', 'BULK_APPROVE', 'PROFILE_ARCHIVED', 'PROFILE_EDITED'];
  while (count < targetCount && activeProfiles.length > 0) {
    const pi = pickRandom(activeProfiles);
    const action = pickRandom(auditActions);
    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action,
        metadata: action === 'BULK_APPROVE' ? { batchSize: randomInt(5, 20) } : undefined,
      },
    });
    count++;
    progressBar(count, targetCount, 'Audit Events');
  }

  progressBar(targetCount, targetCount, 'Audit Events');
}
