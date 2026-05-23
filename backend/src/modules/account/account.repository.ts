import { prisma } from '../../database/prisma.js';
import type { AccountState } from '@prisma/client';
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

      const basicPlan = await tx.membershipPlan.findUnique({ where: { code: 'BASIC' } });
      if (basicPlan) {
        await tx.accountMembership.create({
          data: {
            accountId: account.id,
            planId: basicPlan.id,
            planCode: basicPlan.code,
            planName: basicPlan.displayName,
            planPrice: basicPlan.price,
            currency: basicPlan.currency,
            startsAt: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      const counter = await tx.accountNoCounter.findUnique({ where: { prefix: appConfig.accountNoPrefix } });
      if (counter) {
        await tx.accountNoCounter.update({
          where: { id: counter.id },
          data: { counter: counter.counter + 1 },
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
        memberships: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { startsAt: 'desc' },
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
            memberships: {
              where: { status: 'ACTIVE' },
              take: 1,
              orderBy: { startsAt: 'desc' },
            },
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
            memberships: {
              where: { status: 'ACTIVE' },
              take: 1,
              orderBy: { startsAt: 'desc' },
            },
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

  async updateState(accountId: string, state: AccountState, reason?: string, changedBy?: string) {
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
}
