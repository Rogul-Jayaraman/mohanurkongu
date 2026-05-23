import { AccountRepository } from './account.repository.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { hashPassword, verifyPassword } from '../../common/utils/crypto.js';
import type { ChangePasswordDto } from '../auth/dto/change-password.dto.js';
import { prisma } from '../../database/prisma.js';

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
      id: account.id,
      accountNo: account.accountNo,
      firstNameEn: enTranslation?.firstName || '',
      lastNameEn: enTranslation?.lastName || '',
      firstNameTa: taTranslation?.firstName || '',
      lastNameTa: taTranslation?.lastName || '',
      email: account.credential?.email || '',
      phone: account.credential?.phone || '',
      emailVerified: account.credential?.emailVerified || false,
      phoneVerified: account.credential?.phoneVerified || false,
      roles: account.roles.map((r) => r.role.code),
      membership: activeMembership
        ? {
            planCode: activeMembership.planCode,
            planName: activeMembership.planName,
            status: activeMembership.status,
            expiresAt: activeMembership.expiresAt,
            currency: activeMembership.currency,
            price: activeMembership.planPrice,
          }
        : null,
      currentState: account.currentState,
      createdAt: account.createdAt,
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
    await this.repo.updatePassword(accountId, newHash);
  }

  async generateAccountNo(): Promise<string> {
    const prefix = 'MKM';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
}
