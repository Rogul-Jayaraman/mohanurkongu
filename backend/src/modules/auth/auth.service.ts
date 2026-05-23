import { VerificationService } from '../verification/verification.service.js';
import { SessionService } from '../session/session.service.js';
import { AccountRepository } from '../account/account.repository.js';
import { AccountService } from '../account/account.service.js';
import { authConfig } from '../../config/auth.config.js';
import { hashPassword, verifyPassword, dummyHashVerify } from '../../common/utils/crypto.js';
import { signAccessToken, type AccessTokenPayload } from '../../common/utils/jwt.js';
import { sha256 } from '../../common/utils/hash.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { SendRegistrationOtpDto } from './dto/send-registration-otp.dto.js';
import type { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ForgotPasswordOtpDto } from './dto/forgot-password-otp.dto.js';
import type { VerifyResetOtpDto } from './dto/verify-reset-otp.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import type { DeviceInfo } from '../../common/utils/device.js';
import { prisma } from '../../database/prisma.js';

export class AuthService {
  constructor(
    private verificationService: VerificationService,
    private sessionService: SessionService,
    private accountRepo: AccountRepository,
    private accountService: AccountService,
  ) {}

  async sendRegistrationOtp(dto: SendRegistrationOtpDto) {
    const otp = await this.verificationService.sendOtp('EMAIL', dto.email, 'REGISTER');
    return otp;
  }

  async verifyRegistrationOtp(dto: VerifyRegistrationOtpDto) {
    const record = await this.verificationService.verifyOtp('EMAIL', dto.email, dto.otp, 'REGISTER');

    const token = signAccessToken({ sub: record.id, roles: ['SESSION'] });

    await prisma.registrationSession.create({
      data: {
        verificationId: record.id,
        snapshotTarget: dto.email,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return { verificationToken: token };
  }

  async signup(dto: SignupDto) {
    let payload: any;
    try {
      payload = await import('../../common/utils/jwt.js').then((m) => m.verifyAccessToken(dto.verificationToken));
    } catch {
      throw new AppError(400, ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID, 'AUTH_REGISTRATION_SESSION_INVALID');
    }

    const regSession = await prisma.registrationSession.findFirst({
      where: {
        verificationId: payload.sub,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!regSession) {
      throw new AppError(400, ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID, 'AUTH_REGISTRATION_SESSION_INVALID');
    }

    const emailExists = await this.accountRepo.existsByEmail(dto.email);
    if (emailExists) {
      throw new AppError(409, ErrorCodes.AUTH_EMAIL_EXISTS, 'AUTH_EMAIL_EXISTS');
    }

    if (dto.phone) {
      const phoneExists = await this.accountRepo.existsByPhone(dto.phone);
      if (phoneExists) {
        throw new AppError(409, ErrorCodes.AUTH_PHONE_EXISTS, 'AUTH_PHONE_EXISTS');
      }
    }

    const passwordHash = await hashPassword(dto.password);
    const accountNo = await this.accountService.generateAccountNo();

    await this.accountRepo.create({
      accountNo,
      firstNameEn: dto.firstNameEn,
      lastNameEn: dto.lastNameEn,
      firstNameTa: dto.firstNameTa,
      lastNameTa: dto.lastNameTa,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });

    await this.verificationService.consumeVerification(payload.sub);

    await prisma.registrationSession.update({
      where: { id: regSession.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Account created successfully' };
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
      await dummyHashVerify();
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    if (credential.account.currentState === 'DELETED') {
      await dummyHashVerify();
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    if (credential.account.currentState === 'SUSPENDED') {
      await dummyHashVerify();
      throw new AppError(403, ErrorCodes.AUTH_ACCOUNT_SUSPENDED, 'AUTH_ACCOUNT_SUSPENDED');
    }

    if (credential.lockedUntil && credential.lockedUntil > new Date()) {
      throw new AppError(429, ErrorCodes.AUTH_ACCOUNT_LOCKED, 'AUTH_ACCOUNT_LOCKED');
    }

    if (credential.failedLoginCount >= 3) {
      const delay = (credential.failedLoginCount - 3) * 500;
      await new Promise((r) => setTimeout(r, delay));
    }

    const valid = await verifyPassword(credential.passwordHash || '', dto.password);
    if (!valid) {
      await this.accountRepo.incrementFailedLogins(credential.accountId, credential.failedLoginCount);
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    await this.accountRepo.resetFailedLogins(credential.accountId);

    const roles = credential.account.roles.map((r: any) => r.role.code);

    if (dto.portal === 'ADMIN' && !roles.includes('ADMIN')) {
      throw new AppError(403, ErrorCodes.AUTH_PORTAL_MISMATCH, 'AUTH_PORTAL_MISMATCH');
    }

    if (dto.portal === 'USER' && roles.length === 1 && roles[0] === 'ADMIN') {
      throw new AppError(403, ErrorCodes.AUTH_PORTAL_MISMATCH, 'AUTH_PORTAL_MISMATCH');
    }

    const session = await this.sessionService.createSession(
      credential.accountId,
      roles,
      credential.account.tokenVersion,
      device,
    );

    const account = {
      id: credential.accountId,
      accountNo: credential.account.accountNo,
      roles,
      membership: credential.account.memberships?.[0]
        ? {
            planCode: credential.account.memberships[0].planCode,
            planName: credential.account.memberships[0].planName,
            status: credential.account.memberships[0].status,
            expiresAt: credential.account.memberships[0].expiresAt,
          }
        : null,
    };

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      account,
    };
  }

  async refresh(refreshToken: string, device?: DeviceInfo) {
    return this.sessionService.rotateSession(refreshToken, device);
  }

  async logout(refreshToken: string) {
    await this.sessionService.revokeSession(refreshToken);
  }

  async logoutAll(accountId: string) {
    await this.sessionService.revokeAll(accountId);
  }

  async sendPasswordResetOtp(dto: ForgotPasswordOtpDto) {
    const exists = await this.accountRepo.existsByEmail(dto.email);
    if (exists) {
      const otp = await this.verificationService.sendOtp('EMAIL', dto.email, 'RESET_PASSWORD');
    }
    return { email: dto.email };
  }

  async verifyPasswordResetOtp(dto: VerifyResetOtpDto) {
    const record = await this.verificationService.verifyOtp('EMAIL', dto.email, dto.otp, 'RESET_PASSWORD');

    const token = signAccessToken({ sub: record.id, roles: ['SESSION'] });

    await prisma.resetSession.create({
      data: {
        verificationId: record.id,
        snapshotTarget: dto.email,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return { resetToken: token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = await import('../../common/utils/jwt.js').then((m) => m.verifyAccessToken(dto.resetToken));
    } catch {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    const resetSession = await prisma.resetSession.findFirst({
      where: {
        verificationId: payload.sub,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetSession) {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    const newHash = await hashPassword(dto.password);

    await prisma.$transaction(async (tx) => {
      const credential = await tx.accountCredential.findUnique({
        where: { email: dto.email },
        select: { accountId: true },
      });

      if (!credential) {
        throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
      }

      await tx.accountCredential.update({
        where: { email: dto.email },
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

    return { message: 'Password reset successfully' };
  }

  async getProfile(accountId: string) {
    return this.accountService.getProfile(accountId);
  }

  async changePassword(accountId: string, currentPassword: string, newPassword: string) {
    const cred = await prisma.accountCredential.findUnique({
      where: { accountId },
    });

    if (!cred?.passwordHash) {
      throw new AppError(400, ErrorCodes.AUTH_INVALID_PASSWORD, 'AUTH_INVALID_PASSWORD');
    }

    const valid = await verifyPassword(cred.passwordHash, currentPassword);
    if (!valid) {
      throw new AppError(400, ErrorCodes.AUTH_INVALID_PASSWORD, 'AUTH_INVALID_PASSWORD');
    }

    const newHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.accountCredential.update({
        where: { accountId },
        data: { passwordHash: newHash },
      });

      await tx.account.update({
        where: { id: accountId },
        data: { tokenVersion: { increment: 1 } },
      });
    });

    return { message: 'Password changed successfully' };
  }
}
