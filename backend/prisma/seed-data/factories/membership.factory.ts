import type { PrismaClient } from '@prisma/client';
import {
  randomInt, randomDateBefore, randomDateAfter, pickRandom, randomBool, progressBar,
} from '../helpers.js';

export async function seedMemberships(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  plans: any[],
  targetCount: number,
): Promise<void> {
  const basicPlan = plans.find((p: any) => p.code === 'BASIC');
  const premiumPlan = plans.find((p: any) => p.code === 'PREMIUM');
  const accountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);

  let created = 0;

  for (const accountId of accountIds.slice(0, targetCount)) {
    const isPremium = randomBool(25);
    const plan = isPremium ? premiumPlan : basicPlan;
    if (!plan) continue;

    const isExpired = randomBool(5) && isPremium;
    const isCancelled = randomBool(3) && isPremium;
    const startsAt = randomDateBefore(new Date(), 90);
    const durationDays = isPremium ? randomInt(30, 365) : 0;
    const expiresAt = isPremium ? randomDateAfter(startsAt, durationDays) : null;

    let status: string;
    if (isExpired) {
      status = 'EXPIRED';
    } else if (isCancelled) {
      status = 'CANCELLED';
    } else {
      status = 'ACTIVE';
    }

    if (!isPremium && !basicPlan) continue;

    await prisma.accountMembership.create({
      data: {
        accountId,
        planId: plan.id,
        planCode: plan.code,
        planName: plan.displayName,
        planPrice: plan.price,
        currency: plan.currency || 'INR',
        startsAt,
        expiresAt: (isExpired && expiresAt) ? expiresAt : isPremium ? expiresAt : null,
        status: status as any,
      },
    });

    created++;
    progressBar(created, targetCount, 'Memberships');
  }

  progressBar(targetCount, targetCount, 'Memberships');
}
