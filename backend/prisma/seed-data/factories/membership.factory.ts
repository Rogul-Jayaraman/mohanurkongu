import type { PrismaClient, MembershipPlanCode } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomInt, randomDateBefore, randomDateAfter, randomBool,
  weightedPick, pickRandom, shuffleArray, progressBar,
} from '../helpers.js';

export async function seedMemberships(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  plans: any[],
  targetCount: number,
  adminIds: string[],
): Promise<void> {
  const planMap = new Map(plans.map((p: any) => [p.code, p]));
  const accountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);
  const freeAccountIds = shuffleArray(accountIds);
  let created = 0;

  for (const accountId of freeAccountIds.slice(0, targetCount)) {
    const tierCode = weightedPick(SEED_CONFIG.MEMBERSHIP_TIER_DISTRIBUTION);
    const plan = planMap.get(tierCode);
    if (!plan) continue;

    const isPremium = tierCode !== 'BRONZE';
    const isExpired = isPremium && randomBool(SEED_CONFIG.MEMBERSHIP_EXPIRED_PCT * 100);
    const isCancelled = isPremium && randomBool(SEED_CONFIG.MEMBERSHIP_CANCELLED_PCT * 100);
    const startsAt = randomDateBefore(new Date(), randomInt(1, 180));
    const expiresAt = isPremium
      ? (isExpired
        ? randomDateBefore(new Date(), randomInt(1, 30))
        : randomDateAfter(startsAt, plan.durationDays || randomInt(30, 365)))
      : null;

    let status: string;
    if (isExpired) status = 'EXPIRED';
    else if (isCancelled) status = 'CANCELLED';
    else status = 'ACTIVE';

    const adminId = adminIds.length > 0 ? pickRandom(adminIds) : null;

    const subscription = await prisma.subscription.create({
      data: {
        accountId,
        planId: plan.id,
        status: status as any,
        startedAt: startsAt,
        expiresAt,
        assignedByAdminId: status === 'ACTIVE' && isPremium ? adminId : null,
        snapshotPlanCode: plan.code as MembershipPlanCode,
        snapshotPlanName: plan.displayName,
        snapshotDisplayPrice: plan.displayPrice,
        snapshotDurationDays: plan.durationDays,
        snapshotOpenLimit: plan.openLimit,
        snapshotShortlistLimit: plan.shortlistLimit,
        snapshotProfileSlotLimit: plan.profileSlotLimit,
        snapshotContactAccess: plan.contactAccess,
        snapshotFullHoroscopeAccess: plan.fullHoroscopeAccess,
        snapshotPrintProfile: plan.printProfile,
        snapshotPrintHoroscope: plan.printHoroscope,
        snapshotSearchLevel: plan.searchLevel as any,
      },
    });

    if (status === 'ACTIVE') {
      const maxOpen = plan.openLimit > 0 ? plan.openLimit : 50;
      const openUsed = randomInt(0, Math.max(0, maxOpen));

      try {
        await prisma.membershipUsage.create({
          data: {
            accountId,
            subscriptionId: subscription.id,
            openUsed,
          },
        });
      } catch {
        // usage already exists
      }
    }

    created++;
    progressBar(created, targetCount, 'Memberships');
  }

  progressBar(targetCount, targetCount, 'Memberships');
}
