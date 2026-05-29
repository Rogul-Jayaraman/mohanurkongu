import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomDate, randomDateAfter, randomDateBefore,
  randomInt, pickRandom, weightedPickRaw, shuffleArray, progressBar,
} from '../helpers.js';

export async function seedVerificationAndAudit(
  prisma: PrismaClient,
  profileIndex: Record<string, any>,
  adminAccountIds: string[],
): Promise<void> {
  const allProfiles = Object.values(profileIndex) as any[];
  const pendingProfiles = allProfiles.filter(p => p.status === 'PENDING');
  const activeProfiles = allProfiles.filter(p => p.status === 'ACTIVE');
  const rejectedProfiles = allProfiles.filter(p => p.status === 'REJECTED');

  const totalOps = pendingProfiles.length + activeProfiles.length + rejectedProfiles.length;
  let done = 0;

  for (const pi of pendingProfiles) {
    const hasEscalation = randomInt(0, 10) === 0;

    await prisma.verificationQueue.create({
      data: {
        profileId: pi.profile.id,
        assignedTo: null,
        priority: hasEscalation ? randomInt(5, 10) : randomInt(0, 5),
        createdAt: randomDateBefore(new Date(), 7),
        notes: hasEscalation ? 'Escalated - needs senior admin review' : null,
      },
    });
    done++;
    progressBar(done, totalOps, 'Verification');
  }

  for (const pi of activeProfiles) {
    const approvedAt = pi.profile.approvedAt || randomDateAfter(pi.profile.createdAt, randomInt(1, 14));
    const adminId = pickRandom(adminAccountIds);

    await prisma.verificationQueue.create({
      data: {
        profileId: pi.profile.id,
        assignedTo: adminId,
        claimedAt: randomDateBefore(approvedAt, randomInt(0, 2)),
        completedAt: approvedAt,
        createdAt: randomDateBefore(approvedAt, randomInt(1, 7)),
        updatedAt: approvedAt,
        priority: randomInt(0, 3),
      },
    });

    await prisma.profileReview.create({
      data: {
        profileId: pi.profile.id,
        reviewerId: adminId,
        action: 'APPROVED',
        reviewData: { confidence: randomInt(70, 100), notes: 'Profile verified successfully' },
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
    const rejectedAt = pi.profile.rejectedAt || randomDateAfter(pi.profile.createdAt, randomInt(1, 7));
    const adminId = pickRandom(adminAccountIds);

    await prisma.verificationQueue.create({
      data: {
        profileId: pi.profile.id,
        assignedTo: adminId,
        claimedAt: randomDateBefore(rejectedAt, randomInt(0, 1)),
        completedAt: rejectedAt,
        createdAt: randomDateBefore(rejectedAt, randomInt(1, 3)),
        updatedAt: rejectedAt,
        priority: randomInt(0, 5),
      },
    });

    await prisma.profileReview.create({
      data: {
        profileId: pi.profile.id,
        reviewerId: adminId,
        action: 'REJECTED',
        reasonEn: pi.profile.rejectionReasonEn || 'Profile does not meet guidelines',
        reasonTa: pi.profile.rejectionReasonTa || 'சுயவிவரம் வழிகாட்டுதல்களை பூர்த்தி செய்யவில்லை',
        reviewData: { flags: ['photo_quality', 'incomplete_info'], severity: randomInt(1, 3) },
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
  const allProfiles = Object.values(profileIndex) as any[];
  const archiveProfiles = allProfiles.filter(p => p.status === 'ARCHIVED');
  const deleteProfiles = allProfiles.filter(p => p.status === 'DELETED');
  const activeProfiles = allProfiles.filter(p => p.status === 'ACTIVE');

  let count = 0;

  for (const pi of archiveProfiles) {
    const archivedAt = pi.profile.archivedAt || new Date();
    const adminId = pickRandom(adminAccountIds);
    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action: 'PROFILE_ARCHIVED',
        metadata: { reason: pickRandom(SEED_CONFIG.ARCHIVE_REASONS) },
        createdAt: archivedAt,
      },
    });
    count++;
  }

  for (const pi of deleteProfiles) {
    const adminId = pickRandom(adminAccountIds);
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

  const auditActions = SEED_CONFIG.ADMIN_AUDIT_ACTIONS.filter(
    a => !['PROFILE_APPROVED', 'PROFILE_REJECTED', 'PROFILE_ARCHIVED', 'PROFILE_DELETED'].includes(a)
  );
  while (count < targetCount && activeProfiles.length > 0) {
    const pi = pickRandom(activeProfiles);
    const action = pickRandom(auditActions);
    const adminId = pickRandom(adminAccountIds);
    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action,
        metadata: action === 'BULK_APPROVE' ? { batchSize: randomInt(5, 20) }
          : action === 'ACCOUNT_SUSPENDED' ? { reason: 'TOS violation' }
          : action === 'FRAUD_FLAGGED' ? { fraudScore: randomInt(60, 95) }
          : undefined,
        createdAt: randomDateBefore(new Date(), randomInt(1, 90)),
      },
    });
    count++;
    progressBar(count, targetCount, 'Audit Events');
  }

  progressBar(targetCount, targetCount, 'Audit Events');
}
