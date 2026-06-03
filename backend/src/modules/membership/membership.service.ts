import { prisma } from '../../database/prisma.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { MembershipPlanCode, SearchLevel, ViewDetails, MembershipStatus, PlanStatus, PaymentMethod, Prisma } from '@prisma/client';

export type CapabilitySnapshot = {
  planCode: MembershipPlanCode;
  planName: string;
  openLimit: number;
  openRemaining: number;
  shortlistLimit: number;
  profileSlotLimit: number;
  viewDetails: ViewDetails;
  printProfile: boolean;
  printHoroscope: boolean;
  searchLevel: SearchLevel;
  isActive: boolean;
  expiresAt: Date | null;
};

export class MembershipService {
  async isMembershipEnabled(): Promise<boolean> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'membership_enabled' },
    });
    return setting?.value === 'true';
  }

  async getActivePlans(): Promise<any[]> {
    return prisma.membershipPlan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayPrice: 'asc' },
    });
  }

  async getAllPlans(): Promise<any[]> {
    return prisma.membershipPlan.findMany({
      orderBy: { displayPrice: 'asc' },
    });
  }

  async getPlanById(planId: string): Promise<any> {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError(404, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND);
    return plan;
  }

  async updatePlan(planId: string, data: any): Promise<any> {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError(404, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND);

    const updateData: any = {};
    if (data.displayPrice !== undefined) updateData.displayPrice = data.displayPrice;
    if (data.durationDays !== undefined) updateData.durationDays = data.durationDays;
    if (data.openLimit !== undefined) updateData.openLimit = data.openLimit;
    if (data.shortlistLimit !== undefined) updateData.shortlistLimit = data.shortlistLimit;
    if (data.profileSlotLimit !== undefined) updateData.profileSlotLimit = data.profileSlotLimit;
    if (data.viewDetails !== undefined) updateData.viewDetails = data.viewDetails;
    if (data.printProfile !== undefined) updateData.printProfile = data.printProfile;
    if (data.printHoroscope !== undefined) updateData.printHoroscope = data.printHoroscope;
    if (data.searchLevel !== undefined) updateData.searchLevel = data.searchLevel;
    if (data.status !== undefined) updateData.status = data.status as PlanStatus;

    return prisma.membershipPlan.update({
      where: { id: planId },
      data: updateData,
    });
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  async updateSetting(key: string, value: string, adminId: string): Promise<void> {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedByAdminId: adminId },
      create: { key, value, updatedByAdminId: adminId },
    });
  }

  async getUserSubscription(accountId: string): Promise<any> {
    return prisma.subscription.findFirst({
      where: { accountId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async getSubscriptionHistory(accountId: string): Promise<any[]> {
    return prisma.subscription.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async assignSubscription(
    adminId: string,
    accountId: string,
    planId: string,
    options?: { paymentMethod?: PaymentMethod; notes?: string },
  ): Promise<any> {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError(404, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND);
    if (plan.status !== 'ACTIVE') {
      throw new AppError(400, ErrorCodes.MEMBERSHIP_PLAN_INACTIVE, ErrorCodes.MEMBERSHIP_PLAN_INACTIVE);
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AppError(404, ErrorCodes.ACCOUNT_NOT_FOUND, ErrorCodes.ACCOUNT_NOT_FOUND);

    await prisma.subscription.updateMany({
      where: { accountId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    const now = new Date();
    const expiresAt = plan.durationDays > 0
      ? new Date(now.getTime() + plan.durationDays * 86400000)
      : null;

    return prisma.subscription.create({
      data: {
        accountId,
        planId: plan.id,
        status: 'ACTIVE',
        startedAt: now,
        expiresAt,
        assignedByAdminId: adminId,
        paymentMethod: options?.paymentMethod ?? null,
        snapshotPlanCode: plan.code,
        snapshotPlanName: plan.displayName,
        snapshotDisplayPrice: plan.displayPrice,
        snapshotDurationDays: plan.durationDays,
        snapshotOpenLimit: plan.openLimit,
        snapshotShortlistLimit: plan.shortlistLimit,
        snapshotProfileSlotLimit: plan.profileSlotLimit,
        snapshotViewDetails: plan.viewDetails,
        snapshotPrintProfile: plan.printProfile,
        snapshotPrintHoroscope: plan.printHoroscope,
        snapshotSearchLevel: plan.searchLevel,
        notes: options?.notes || null,
      },
    });
  }

  async resolveCapabilities(accountId: string): Promise<CapabilitySnapshot | null> {
    const enabled = await this.isMembershipEnabled();
    if (!enabled) {
      return {
        planCode: 'BRONZE' as MembershipPlanCode,
        planName: 'Full Access',
        openLimit: -1,
        openRemaining: -1,
        shortlistLimit: -1,
        profileSlotLimit: -1,
        viewDetails: 'FULL' as ViewDetails,
        printProfile: true,
        printHoroscope: true,
        searchLevel: 'FULL' as SearchLevel,
        isActive: true,
        expiresAt: null,
      };
    }

    const sub = await prisma.subscription.findFirst({
      where: { accountId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      const bronze = await prisma.membershipPlan.findUnique({ where: { code: 'BRONZE' } });
      if (!bronze) return null;
      return {
        planCode: 'BRONZE' as MembershipPlanCode,
        planName: 'Bronze',
        openLimit: 10,
        openRemaining: 10,
        shortlistLimit: 0,
        profileSlotLimit: 1,
        viewDetails: 'BASIC' as ViewDetails,
        printProfile: false,
        printHoroscope: false,
        searchLevel: 'BASIC' as SearchLevel,
        isActive: true,
        expiresAt: null,
      };
    }

    const usage = await prisma.membershipUsage.findUnique({
      where: { accountId },
    });

    const openUsed = usage?.openUsed ?? 0;
    const openLimit = sub.snapshotOpenLimit;
    const openRemaining = openLimit < 0 ? -1 : Math.max(0, openLimit - openUsed);

    return {
      planCode: sub.snapshotPlanCode,
      planName: sub.snapshotPlanName,
      openLimit,
      openRemaining,
      shortlistLimit: sub.snapshotShortlistLimit,
      profileSlotLimit: sub.snapshotProfileSlotLimit,
      viewDetails: sub.snapshotViewDetails,
      printProfile: sub.snapshotPrintProfile,
      printHoroscope: sub.snapshotPrintHoroscope,
      searchLevel: sub.snapshotSearchLevel,
      isActive: sub.status === 'ACTIVE',
      expiresAt: sub.expiresAt,
    };
  }

  async getPreviousSubscription(accountId: string): Promise<any> {
    return prisma.subscription.findFirst({
      where: { accountId, status: 'CANCELLED', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async cancelSubscription(
    adminId: string,
    accountId: string,
    action: 'cancel' | 'revert',
  ): Promise<any> {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AppError(404, ErrorCodes.ACCOUNT_NOT_FOUND, ErrorCodes.ACCOUNT_NOT_FOUND);

    const currentSub = await prisma.subscription.findFirst({
      where: { accountId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSub) {
      throw new AppError(400, ErrorCodes.SUBSCRIPTION_NOT_FOUND, ErrorCodes.SUBSCRIPTION_NOT_FOUND);
    }

    await prisma.subscription.updateMany({
      where: { accountId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    const now = new Date();

    if (action === 'revert') {
      const prevSub = await prisma.subscription.findFirst({
        where: { accountId, status: 'CANCELLED', id: { not: currentSub.id }, expiresAt: { gt: now } },
        orderBy: { createdAt: 'desc' },
      });

      if (!prevSub) {
        throw new AppError(400, ErrorCodes.NO_REVERTABLE_SUBSCRIPTION, ErrorCodes.NO_REVERTABLE_SUBSCRIPTION);
      }

      return prisma.subscription.create({
        data: {
          accountId,
          planId: prevSub.snapshotPlanCode === currentSub.snapshotPlanCode ? prevSub.planId : prevSub.planId,
          status: 'ACTIVE',
          startedAt: now,
          expiresAt: prevSub.expiresAt,
          assignedByAdminId: adminId,
          snapshotPlanCode: prevSub.snapshotPlanCode,
          snapshotPlanName: prevSub.snapshotPlanName,
          snapshotDisplayPrice: prevSub.snapshotDisplayPrice,
          snapshotDurationDays: prevSub.snapshotDurationDays,
          snapshotOpenLimit: prevSub.snapshotOpenLimit,
          snapshotShortlistLimit: prevSub.snapshotShortlistLimit,
          snapshotProfileSlotLimit: prevSub.snapshotProfileSlotLimit,
          snapshotViewDetails: prevSub.snapshotViewDetails,
          snapshotPrintProfile: prevSub.snapshotPrintProfile,
          snapshotPrintHoroscope: prevSub.snapshotPrintHoroscope,
          snapshotSearchLevel: prevSub.snapshotSearchLevel,
          notes: `Reverted from ${currentSub.snapshotPlanName} by admin`,
        },
      });
    }

    const bronze = await prisma.membershipPlan.findUnique({ where: { code: 'BRONZE' } });
    if (!bronze) {
      throw new AppError(500, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND, ErrorCodes.MEMBERSHIP_PLAN_NOT_FOUND);
    }

    return prisma.subscription.create({
      data: {
        accountId,
        planId: bronze.id,
        status: 'ACTIVE',
        startedAt: now,
        expiresAt: null,
        assignedByAdminId: adminId,
        snapshotPlanCode: bronze.code,
        snapshotPlanName: bronze.displayName,
        snapshotDisplayPrice: bronze.displayPrice,
        snapshotDurationDays: bronze.durationDays,
        snapshotOpenLimit: bronze.openLimit,
        snapshotShortlistLimit: bronze.shortlistLimit,
        snapshotProfileSlotLimit: bronze.profileSlotLimit,
        snapshotViewDetails: bronze.viewDetails,
        snapshotPrintProfile: bronze.printProfile,
        snapshotPrintHoroscope: bronze.printHoroscope,
        snapshotSearchLevel: bronze.searchLevel,
        notes: `Cancelled from ${currentSub.snapshotPlanName} by admin`,
      },
    });
  }

  async getUsageCounts(accountId: string): Promise<{ profileCount: number; shortlistCount: number }> {
    const [profileCount, shortlistCount] = await Promise.all([
      prisma.profile.count({
        where: { accountId, currentStatus: { in: ['DRAFT', 'PENDING', 'ACTIVE', 'ARCHIVED'] } },
      }),
      prisma.shortlist.count({ where: { accountId } }),
    ]);
    return { profileCount, shortlistCount };
  }

  async getAllSubscriptions(params: {
    limit?: number;
    cursor?: string;
    status?: MembershipStatus;
  }): Promise<any> {
    const { limit = 20, cursor, status } = params;
    const safeLimit = Math.min(Math.max(1, Number(limit)), 100);
    const where: any = {};
    if (status) where.status = status;

    const rows = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: safeLimit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        account: {
          include: {
            translations: { where: { language: 'EN' }, take: 1 },
          },
        },
        plan: { select: { code: true, displayName: true } },
      },
    });

    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop();

    const lastRow = rows[rows.length - 1];
    return {
      subscriptions: rows,
      pagination: { cursor: hasMore && lastRow ? lastRow.id : null, hasMore, limit: safeLimit },
    };
  }
}
