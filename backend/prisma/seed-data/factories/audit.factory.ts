import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomInt, randomDateBefore, randomDateAfter, randomBool,
  pickRandom, weightedPickRaw, progressBar,
} from '../helpers.js';

export async function seedProfileOpens(
  prisma: PrismaClient,
  profileIndex: Record<string, any>,
  accountIndex: Record<number, any>,
  activeSubscriptionIds: string[],
  targetCount: number,
): Promise<void> {
  const activeProfiles = Object.values(profileIndex).filter(
    (pi: any) => pi.status === 'ACTIVE',
  ) as any[];
  const accountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);

  if (activeProfiles.length === 0 || activeSubscriptionIds.length === 0) return;

  let created = 0;
  const used = new Set<string>();

  for (let i = 0; i < targetCount; i++) {
    const pi = pickRandom(activeProfiles);
    const viewerId = pickRandom(accountIds);
    if (viewerId === pi.accountId) continue;

    const key = `${viewerId}_${pi.profile.id}`;
    if (used.has(key)) continue;
    used.add(key);

    const subId = pickRandom(activeSubscriptionIds);

    await prisma.profileOpen.create({
      data: {
        viewerAccountId: viewerId,
        profileId: pi.profile.id,
        subscriptionId: subId,
        openedAt: randomDateBefore(new Date(), randomInt(0, 60)),
      },
    });

    created++;
    progressBar(created, targetCount, 'Profile Opens');
  }

  progressBar(targetCount, targetCount, 'Profile Opens');
}

export async function seedAdminAuditBulk(
  prisma: PrismaClient,
  adminAccountIds: string[],
  profileIndex: Record<string, any>,
  targetCount: number,
): Promise<void> {
  const allProfiles = Object.values(profileIndex) as any[];
  const activeProfiles = allProfiles.filter(p => p.status === 'ACTIVE');
  let created = 0;

  const actions = [
    'CONTACT_REQUEST',
    'PROFILE_EDITED',
    'ASSIGNED_REVIEWER',
    'FRAUD_FLAGGED',
  ];

  while (created < targetCount) {
    const pi = pickRandom(activeProfiles);
    const adminId = pickRandom(adminAccountIds);
    const action = pickRandom(actions);

    await prisma.adminAuditEvent.create({
      data: {
        actorId: adminId,
        profileId: pi.profile.id,
        action,
        metadata: action === 'CONTACT_REQUEST'
          ? { requestedBy: pi.accountId, requestedAt: new Date().toISOString() }
          : action === 'FRAUD_FLAGGED'
          ? { fraudScore: randomInt(60, 98), flags: ['suspicious_activity', 'duplicate_photos'] }
          : action === 'ASSIGNED_REVIEWER'
          ? { reviewerId: adminId, previousReviewer: null }
          : undefined,
        ipAddress: `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`,
        createdAt: randomDateBefore(new Date(), randomInt(1, 60)),
      },
    });

    created++;
    progressBar(created, targetCount, 'Admin Audit Events');
  }
}
