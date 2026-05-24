import { AccountRepository } from '../account/account.repository.js';
import { SessionService } from '../session/session.service.js';
import { AccountService } from '../account/account.service.js';
import { authConfig } from '../../config/auth.config.js';
import { verifyPassword } from '../../common/utils/crypto.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { AdminLoginDto } from './dto/admin-login.dto.js';
import type { DeviceInfo } from '../../common/utils/device.js';

export class AdminAuthService {
  constructor(
    private accountRepo: AccountRepository,
    private sessionService: SessionService,
    private accountService: AccountService,
  ) {}

  async login(dto: AdminLoginDto, device?: DeviceInfo) {
    let credential: any;
    const isEmail = dto.identifier.includes('@');

    if (isEmail) {
      credential = await this.accountRepo.findCredentialByEmail(dto.identifier.toLowerCase());
    } else {
      credential = await this.accountRepo.findCredentialByPhone(dto.identifier);
    }

    if (!credential) {
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    if (credential.account.currentState === 'DELETED') {
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    if (credential.account.currentState === 'SUSPENDED') {
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

    if (!roles.includes('ADMIN')) {
      throw new AppError(403, ErrorCodes.AUTH_PORTAL_MISMATCH, 'AUTH_PORTAL_MISMATCH');
    }

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
      role: 'ADMIN' as const,
      sessionId: session.sessionId,
    };
  }

  async getProfile(accountId: string) {
    return this.accountService.getProfile(accountId);
  }
}
