import { SessionService } from '../session/session.service.js';
import { AccountRepository } from '../account/account.repository.js';
import { AccountService } from '../account/account.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { authConfig } from '../../config/auth.config.js';
import { hashPassword, verifyPassword } from '../../common/utils/crypto.js';
import {
  signVerificationToken,
  verifyVerificationToken,
  signResetToken,
  verifyResetToken,
} from '../../common/utils/jwt.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { SignupDto } from './dto/signup.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import type { DeviceInfo } from '../../common/utils/device.js';
import { prisma } from '../../database/prisma.js';
import { enqueueAuditEvent } from '../../common/utils/audit.js';

export class AuthService {
  constructor(
    private sessionService: SessionService,
    private accountRepo: AccountRepository,
    private accountService: AccountService,
    private notificationService: NotificationService,
  ) {}

  async register(dto: SignupDto) {
    let payload;
    try {
      payload = verifyVerificationToken(dto.verificationToken);
    } catch {
      throw new AppError(400, ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID, 'AUTH_REGISTRATION_SESSION_INVALID');
    }

    if (payload.type !== 'verification' || payload.purpose !== 'register') {
      throw new AppError(400, ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID, 'AUTH_REGISTRATION_SESSION_INVALID');
    }

    const verificationId = payload.sub;

    return prisma.$transaction(async (tx) => {
      const regSession = await tx.registrationSession.findFirst({
        where: {
          verificationId,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!regSession) {
        throw new AppError(400, ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID, 'AUTH_REGISTRATION_SESSION_INVALID');
      }

      const verificationRecord = await tx.accountVerification.findUnique({
        where: { id: verificationId },
        select: { type: true, target: true },
      });

      if (!verificationRecord) {
        throw new AppError(400, ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID, 'AUTH_REGISTRATION_SESSION_INVALID');
      }

      if (verificationRecord.target !== regSession.snapshotTarget) {
        throw new AppError(400, ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID, 'AUTH_REGISTRATION_SESSION_INVALID');
      }

      const passwordHash = await hashPassword(dto.password);
      const accountNo = await this.accountService.generateAccountNo(tx);

      let account;
      try {
        account = await tx.account.create({
          data: {
            accountNo,
            translations: {
              create: [
                {
                  language: 'EN',
                  firstName: dto.firstNameEn,
                  lastName: dto.lastNameEn,
                  isDefault: true,
                },
                {
                  language: 'TA',
                  firstName: dto.firstNameTa,
                  lastName: dto.lastNameTa,
                },
              ],
            },
            credential: {
              create: {
                email: regSession.snapshotTarget,
                phone: dto.phone,
                passwordHash,
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
      } catch (err: any) {
        if (err?.code === 'P2002') {
          const target = err.meta?.target as string[] | undefined;
          if (target?.includes('email')) {
            throw new AppError(409, ErrorCodes.AUTH_EMAIL_EXISTS, 'AUTH_EMAIL_EXISTS');
          }
          if (target?.includes('phone')) {
            throw new AppError(409, ErrorCodes.AUTH_PHONE_EXISTS, 'AUTH_PHONE_EXISTS');
          }
        }
        throw err;
      }

      const userRole = await tx.role.findUnique({ where: { code: 'USER' } });
      if (!userRole) {
        throw new AppError(500, ErrorCodes.INTERNAL_ERROR, 'Default role not configured');
      }
      await tx.accountRole.create({
        data: { accountId: account.id, roleId: userRole.id },
      });

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

      await tx.registrationSession.update({
        where: { id: regSession.id },
        data: { usedAt: new Date() },
      });

      await tx.accountVerification.update({
        where: { id: verificationId },
        data: { state: 'ARCHIVED', consumedAt: new Date() },
      });

      await tx.accountCredential.update({
        where: { accountId: account.id },
        data: {
          emailVerified: verificationRecord.type === 'EMAIL',
          phoneVerified: verificationRecord.type === 'PHONE',
        },
      });

      await this.notificationService.sendWelcomeEmail(regSession.snapshotTarget, dto.firstNameEn, '');

      const roles = ['USER'];
      const session = await this.sessionService.createSession(
        account.id,
        roles,
        account.tokenVersion,
        undefined,
        tx,
      );

      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        accountId: account.id,
        role: 'USER' as const,
        sessionId: session.sessionId,
      };
    });
  }

  async login(dto: LoginDto, device?: DeviceInfo) {
    let credential: any;
    const isEmail = dto.identifier.includes('@');

    if (isEmail) {
      credential = await this.accountRepo.findCredentialByEmail(dto.identifier.toLowerCase());
    } else {
      credential = await this.accountRepo.findCredentialByPhone(dto.identifier);
    }

    if (!credential) {
      const identifier = dto.identifier.includes('@') ? dto.identifier.toLowerCase() : dto.identifier;
      await enqueueAuditEvent('LOGIN_FAILED', undefined, { identifier, reason: 'account_not_found' });
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    if (credential.account.currentState === 'DELETED') {
      await enqueueAuditEvent('LOGIN_FAILED', credential.accountId, { reason: 'deleted' });
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    if (credential.account.currentState === 'SUSPENDED') {
      await enqueueAuditEvent('LOGIN_FAILED', credential.accountId, { reason: 'suspended' });
      throw new AppError(403, ErrorCodes.AUTH_ACCOUNT_SUSPENDED, 'AUTH_ACCOUNT_SUSPENDED');
    }

    if (credential.lockedUntil && credential.lockedUntil > new Date()) {
      await enqueueAuditEvent('LOGIN_FAILED', credential.accountId, { reason: 'locked' });
      throw new AppError(429, ErrorCodes.AUTH_ACCOUNT_LOCKED, 'AUTH_ACCOUNT_LOCKED');
    }

    if (credential.failedLoginCount >= 3) {
      const delay = (credential.failedLoginCount - 3) * 500;
      await new Promise((r) => setTimeout(r, delay));
    }

    const valid = await verifyPassword(credential.passwordHash || '', dto.password);
    if (!valid) {
      await this.accountRepo.incrementFailedLogins(credential.accountId, credential.failedLoginCount);
      await enqueueAuditEvent('LOGIN_FAILED', credential.accountId, { reason: 'invalid_password' });
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    await this.accountRepo.resetFailedLogins(credential.accountId);

    await enqueueAuditEvent('LOGIN_SUCCESS', credential.accountId, { device: device?.fingerprint });

    const roles = credential.account.roles.map((r: any) => r.role.code);

    const session = await this.sessionService.createSession(
      credential.accountId,
      roles,
      credential.account.tokenVersion,
      device,
    );

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accountId: credential.accountId,
      role: roles.includes('ADMIN') ? ('ADMIN' as const) : ('USER' as const),
      sessionId: session.sessionId,
    };
  }

  async refresh(refreshToken: string, device?: DeviceInfo) {
    return this.sessionService.rotateSession(refreshToken, device);
  }

  async logout(refreshToken: string) {
    await this.sessionService.revokeSession(refreshToken, 'LOGOUT');
  }

  async logoutAll(accountId: string) {
    await this.sessionService.revokeAll(accountId);
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload;
    try {
      payload = verifyResetToken(dto.resetToken);
    } catch {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    if (payload.type !== 'reset' || payload.purpose !== 'reset_password') {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    const verificationId = payload.sub;

    const resetSession = await prisma.resetSession.findFirst({
      where: {
        verificationId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetSession) {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    const email = resetSession.snapshotTarget;
    const newHash = await hashPassword(dto.password);
    let accountId: string | undefined;

    await prisma.$transaction(async (tx) => {
      const credential = await tx.accountCredential.findUnique({
        where: { email },
        select: { accountId: true },
      });

      if (!credential) {
        throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
      }

      accountId = credential.accountId;

      await tx.accountCredential.update({
        where: { email },
        data: { passwordHash: newHash },
      });

      await tx.account.update({
        where: { id: credential.accountId },
        data: { tokenVersion: { increment: 1 } },
      });

      await tx.accountSession.updateMany({
        where: { accountId: credential.accountId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'password_reset' },
      });

      await tx.resetSession.update({
        where: { id: resetSession.id },
        data: { usedAt: new Date() },
      });
    });

    await enqueueAuditEvent('PASSWORD_RESET', accountId, {});

    return { message: 'Password reset successfully' };
  }
}
