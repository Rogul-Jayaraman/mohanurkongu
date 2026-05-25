import { AccountRepository } from './account.repository.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { hashPassword, verifyPassword } from '../../common/utils/crypto.js';
import type { ChangePasswordDto } from '../auth/dto/change-password.dto.js';
import { prisma } from '../../database/prisma.js';
import { enqueueAuditEvent } from '../../common/utils/audit.js';
import { appConfig } from '../../config/app.config.js';

export class AccountService {
  constructor(private repo: AccountRepository) {}

  async getProfile(accountId: string) {
    const account = await this.repo.findById(accountId);
    if (!account) {
      throw new AppError(404, ErrorCodes.ACCOUNT_NOT_FOUND, 'ACCOUNT_NOT_FOUND');
    }

    const enTranslation = account.translations.find((t) => t.language === 'EN');
    const taTranslation = account.translations.find((t) => t.language === 'TA');
    const activeMembership = account.memberships[0];

    return {
      accountNo: account.accountNo,
      firstNameEn: enTranslation?.firstName || '',
      lastNameEn: enTranslation?.lastName || '',
      firstNameTa: taTranslation?.firstName || '',
      lastNameTa: taTranslation?.lastName || '',
      email: account.credential?.email || '',
      phone: account.credential?.phone || '',
      membership: activeMembership
        ? {
            planCode: activeMembership.planCode,
            expiresAt: activeMembership.expiresAt,
          }
        : null,
      createdAt: account.createdAt.toISOString(),
    };
  }

  async changePassword(accountId: string, dto: ChangePasswordDto) {
    const credential = await prisma.accountCredential.findUnique({
      where: { accountId },
    });
    if (!credential?.passwordHash) {
      throw new AppError(400, ErrorCodes.AUTH_INVALID_PASSWORD, 'AUTH_INVALID_PASSWORD');
    }

    const valid = await verifyPassword(credential.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new AppError(400, ErrorCodes.AUTH_INVALID_PASSWORD, 'AUTH_INVALID_PASSWORD');
    }

    const newHash = await hashPassword(dto.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.accountCredential.update({
        where: { accountId },
        data: { passwordHash: newHash },
      });

      await tx.account.update({
        where: { id: accountId },
        data: { tokenVersion: { increment: 1 } },
      });

      await tx.accountSession.updateMany({
        where: { accountId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'password_changed' },
      });
    });

    await enqueueAuditEvent('PASSWORD_CHANGE', accountId, {});
  }

  async updateProfile(accountId: string, data: Record<string, any>) {
    const updates: any[] = [];

    if (data.firstNameEn !== undefined || data.lastNameEn !== undefined) {
      updates.push(
        prisma.accountTranslation.update({
          where: { accountId_language: { accountId, language: 'EN' } },
          data: {
            ...(data.firstNameEn !== undefined && { firstName: data.firstNameEn }),
            ...(data.lastNameEn !== undefined && { lastName: data.lastNameEn }),
          },
        }),
      );
    }

    if (data.firstNameTa !== undefined || data.lastNameTa !== undefined) {
      updates.push(
        prisma.accountTranslation.update({
          where: { accountId_language: { accountId, language: 'TA' } },
          data: {
            ...(data.firstNameTa !== undefined && { firstName: data.firstNameTa }),
            ...(data.lastNameTa !== undefined && { lastName: data.lastNameTa }),
          },
        }),
      );
    }

    if (data.phone !== undefined) {
      updates.push(
        prisma.accountCredential.update({
          where: { accountId },
          data: { phone: data.phone },
        }),
      );
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return this.getProfile(accountId);
  }

  async nextCounter(prefix: string, tx?: any): Promise<string> {
    const client = tx || prisma;
    const updated = await client.counter.upsert({
      where: { prefix },
      create: { prefix, counter: 1 },
      update: { counter: { increment: 1 } },
    });
    return `${prefix}-${updated.counter.toString().padStart(4, '0')}`;
  }

  async generateAccountNo(tx?: any): Promise<string> {
    return this.nextCounter(appConfig.prefixes.account, tx);
  }

  async generateRegNo(tx?: any): Promise<string> {
    return this.nextCounter(appConfig.prefixes.reg, tx);
  }
}
