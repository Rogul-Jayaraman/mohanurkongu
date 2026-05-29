import { MembershipService, type CapabilitySnapshot } from './membership.service.js';
import { prisma } from '../../database/prisma.js';

export class MembershipGuard {
  constructor(private membershipService: MembershipService) {}

  async resolveCapabilities(accountId: string): Promise<CapabilitySnapshot | null> {
    return this.membershipService.resolveCapabilities(accountId);
  }

  async checkOpenQuota(accountId: string): Promise<{ allowed: boolean; remaining: number }> {
    const caps = await this.resolveCapabilities(accountId);
    if (!caps) return { allowed: true, remaining: -1 };
    if (caps.openLimit < 0) return { allowed: true, remaining: -1 };
    return {
      allowed: caps.openRemaining > 0,
      remaining: caps.openRemaining,
    };
  }

  async consumeOpenQuota(accountId: string, profileId: string): Promise<void> {
    const sub = await this.membershipService.getUserSubscription(accountId);
    if (!sub) return;

    const existing = await prisma.profileOpen.findUnique({
      where: { viewerAccountId_profileId: { viewerAccountId: accountId, profileId } },
    });
    if (existing) return;

    await prisma.$transaction(async (tx) => {
      await tx.profileOpen.create({
        data: {
          viewerAccountId: accountId,
          profileId,
          subscriptionId: sub.id,
        },
      });

      await tx.membershipUsage.upsert({
        where: { accountId },
        create: { accountId, subscriptionId: sub.id, openUsed: 1 },
        update: { openUsed: { increment: 1 } },
      });
    });
  }

  async checkContactAccess(accountId: string): Promise<boolean> {
    const caps = await this.resolveCapabilities(accountId);
    return caps?.contactAccess ?? false;
  }

  async checkFullHoroscopeAccess(accountId: string): Promise<boolean> {
    const caps = await this.resolveCapabilities(accountId);
    return caps?.fullHoroscopeAccess ?? false;
  }

  async checkPrintAccess(accountId: string, type: 'profile' | 'horoscope'): Promise<boolean> {
    const caps = await this.resolveCapabilities(accountId);
    if (!caps) return false;
    return type === 'profile' ? caps.printProfile : caps.printHoroscope;
  }

  async checkShortlistLimit(accountId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const caps = await this.resolveCapabilities(accountId);
    if (!caps) return { allowed: true, current: 0, limit: -1 };
    if (caps.shortlistLimit < 0) return { allowed: true, current: 0, limit: -1 };

    const current = await prisma.shortlist.count({ where: { accountId } });
    return {
      allowed: current < caps.shortlistLimit,
      current,
      limit: caps.shortlistLimit,
    };
  }

  async checkProfileSlotLimit(accountId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const caps = await this.resolveCapabilities(accountId);
    if (!caps) return { allowed: true, current: 0, limit: -1 };
    if (caps.profileSlotLimit < 0) return { allowed: true, current: 0, limit: -1 };

    const current = await prisma.profile.count({
      where: {
        accountId,
        currentStatus: { in: ['DRAFT', 'PENDING', 'ACTIVE', 'ARCHIVED'] },
      },
    });
    return {
      allowed: current < caps.profileSlotLimit,
      current,
      limit: caps.profileSlotLimit,
    };
  }

  async getSearchLevel(accountId: string): Promise<string> {
    const caps = await this.resolveCapabilities(accountId);
    return caps?.searchLevel ?? 'BASIC';
  }
}
