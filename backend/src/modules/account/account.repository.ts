import { prisma } from '../../database/prisma.js';
import type { AccountStatus } from '@prisma/client';
import { appConfig } from '../../config/app.config.js';

export interface CreateAccountData {
  accountNo: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  email: string;
  phone?: string;
  passwordHash: string;
}

export class AccountRepository {
  async existsByEmail(email: string): Promise<boolean> {
    const cred = await prisma.accountCredential.findUnique({ where: { email } });
    return cred !== null;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const cred = await prisma.accountCredential.findUnique({ where: { phone } });
    return cred !== null;
  }

  async create(data: CreateAccountData) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          accountNo: data.accountNo,
          translations: {
            create: [
              {
                language: 'EN',
                firstName: data.firstNameEn,
                lastName: data.lastNameEn,
                isDefault: true,
              },
              {
                language: 'TA',
                firstName: data.firstNameTa,
                lastName: data.lastNameTa,
              },
            ],
          },
          credential: {
            create: {
              email: data.email,
              phone: data.phone,
              passwordHash: data.passwordHash,
            },
          },
          statusHistory: {
            create: {
              state: 'ACTIVE',
              reason: 'Account created',
              changedBy: 'system',
            },
          },
        },
        include: {
          translations: true,
          credential: true,
          statusHistory: true,
        },
      });

      const userRole = await tx.role.findUnique({ where: { code: 'USER' } });
      if (userRole) {
        await tx.accountRole.create({
          data: { accountId: account.id, roleId: userRole.id },
        });
      }

      const freePlan = await tx.membershipPlan.findUnique({ where: { code: 'BRONZE' } });
      if (freePlan) {
        await tx.subscription.create({
          data: {
            accountId: account.id,
            planId: freePlan.id,
            startedAt: new Date(),
            status: 'ACTIVE',
            snapshotPlanCode: freePlan.code,
            snapshotPlanName: freePlan.displayName,
            snapshotDisplayPrice: freePlan.displayPrice,
            snapshotDurationDays: freePlan.durationDays,
            snapshotOpenLimit: freePlan.openLimit,
            snapshotShortlistLimit: freePlan.shortlistLimit,
            snapshotProfileSlotLimit: freePlan.profileSlotLimit,
            snapshotContactAccess: freePlan.contactAccess,
            snapshotFullHoroscopeAccess: freePlan.fullHoroscopeAccess,
            snapshotPrintProfile: freePlan.printProfile,
            snapshotPrintHoroscope: freePlan.printHoroscope,
            snapshotSearchLevel: freePlan.searchLevel,
          },
        });
      }

      return account;
    });
  }

  async findById(id: string) {
    return prisma.account.findUnique({
      where: { id },
      include: {
        translations: true,
        credential: {
          select: {
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            lastLoginAt: true,
          },
        },
        roles: {
          include: { role: true },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { startedAt: 'desc' },
        },
      },
    });
  }

  async findCredentialByEmail(email: string) {
    return prisma.accountCredential.findUnique({
      where: { email },
      include: {
        account: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });
  }

  async findCredentialByPhone(phone: string) {
    return prisma.accountCredential.findUnique({
      where: { phone },
      include: {
        account: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });
  }

  async updatePassword(accountId: string, passwordHash: string) {
    return prisma.accountCredential.update({
      where: { accountId },
      data: { passwordHash },
    });
  }

  async incrementFailedLogins(accountId: string, currentCount: number) {
    const newCount = currentCount + 1;
    const lockedUntil = newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    return prisma.accountCredential.update({
      where: { accountId },
      data: {
        failedLoginCount: newCount,
        lockedUntil,
      },
    });
  }

  async resetFailedLogins(accountId: string) {
    return prisma.accountCredential.update({
      where: { accountId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }

  async updateState(accountId: string, state: AccountStatus, reason?: string, changedBy?: string) {
    return prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { currentState: state },
      });
      await tx.accountStatusHistory.create({
        data: {
          accountId,
          state,
          reason,
          changedBy,
        },
      });
    });
  }

  async incrementTokenVersion(accountId: string) {
    return prisma.account.update({
      where: { id: accountId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async listAccounts(page: number, limit: number, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { accountNo: { contains: search, mode: 'insensitive' } },
        { credential: { email: { contains: search, mode: 'insensitive' } } },
        { credential: { phone: { contains: search } } },
        { translations: { firstName: { contains: search, mode: 'insensitive' } } },
        { translations: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          credential: { select: { email: true, phone: true, emailVerified: true } },
          roles: { include: { role: true } },
          translations: true,
        },
      }),
      prisma.account.count({ where }),
    ]);

    const accountIds = data.map((a) => a.id);

    const allProfiles = await prisma.profile.findMany({
      where: { accountId: { in: accountIds }, currentStatus: { not: 'DELETED' } },
      orderBy: { updatedAt: 'desc' },
      include: {
        photo: {
          include: {
            primaryUpload: { select: { objectKey: true, width: true, height: true } },
          },
        },
      },
    });

    const countMap = new Map<string, number>();
    const latestMap = new Map<string, (typeof allProfiles)[number]>();
    for (const p of allProfiles) {
      countMap.set(p.accountId, (countMap.get(p.accountId) || 0) + 1);
      if (!latestMap.has(p.accountId)) {
        latestMap.set(p.accountId, p);
      }
    }

    const accounts = data.map((account) => {
      const en = account.translations?.find((t: any) => t.language === 'EN');
      const ta = account.translations?.find((t: any) => t.language === 'TA');
      const role = account.roles?.[0]?.role?.code ?? 'USER';
      const latestProfile = latestMap.get(account.id);

      return {
        id: account.id,
        accountNo: account.accountNo,
        firstNameEn: en?.firstName ?? null,
        lastNameEn: en?.lastName ?? null,
        firstNameTa: ta?.firstName ?? null,
        lastNameTa: ta?.lastName ?? null,
        email: account.credential?.email ?? null,
        phone: account.credential?.phone ?? null,
        role,
        currentState: account.currentState,
        emailVerified: account.credential?.emailVerified ?? false,
        createdAt: account.createdAt.toISOString(),
        profileCount: countMap.get(account.id) || 0,
        profilePhoto: latestProfile?.photo?.primaryUpload?.objectKey
          ? { url: `/media/${latestProfile.photo.primaryUpload.objectKey}`, width: latestProfile.photo.primaryUpload.width, height: latestProfile.photo.primaryUpload.height }
          : null,
      };
    });

    return { accounts, total };
  }
}
