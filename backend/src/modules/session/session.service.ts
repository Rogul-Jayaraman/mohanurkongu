import { SessionRepository } from './session.repository.js';
import { AccountRepository } from '../account/account.repository.js';
import { authConfig } from '../../config/auth.config.js';
import { signRefreshToken, signAccessToken, verifyRefreshToken, type AccessTokenPayload } from '../../common/utils/jwt.js';
import { sha256 } from '../../common/utils/hash.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { DeviceInfo } from '../../common/utils/device.js';

export class SessionService {
  constructor(
    private sessionRepo: SessionRepository,
    private accountRepo: AccountRepository,
  ) {}

  async createSession(accountId: string, roles: string[], tokenVersion: number, device?: DeviceInfo) {
    const refreshPayload = {
      sub: accountId,
      jti: crypto.randomUUID(),
      tver: tokenVersion,
    };
    const refreshToken = signRefreshToken(refreshPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.sessionRepo.create({
      accountId,
      refreshToken,
      tokenVersion,
      ipHash: device?.ipHash,
      userAgentHash: device?.userAgentHash,
      deviceFingerprint: device?.fingerprint,
      expiresAt,
    });

    await this.enforceMaxSessions(accountId);

    const accessPayload: Omit<AccessTokenPayload, 'type'> = {
      sub: accountId,
      roles,
    };
    const accessToken = signAccessToken(accessPayload);

    return { accessToken, refreshToken };
  }

  private async enforceMaxSessions(accountId: string) {
    const active = await this.sessionRepo.countActiveByAccountId(accountId);
    if (active > authConfig.session.maxActive) {
      const oldest = await this.sessionRepo.findOldestActive(accountId);
      if (oldest) {
        await this.sessionRepo.revoke(oldest.id, 'max_sessions_exceeded');
      }
    }
  }

  async rotateSession(refreshToken: string, device?: DeviceInfo) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, 'AUTH_TOKEN_INVALID');
    }

    if (payload.type !== 'refresh') {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, 'AUTH_TOKEN_INVALID');
    }

    const tokenHash = sha256(refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(tokenHash);
    if (!session) {
      throw new AppError(401, ErrorCodes.AUTH_SESSION_EXPIRED, 'AUTH_SESSION_EXPIRED');
    }

    if (session.revokedAt) {
      await this.sessionRepo.revokeAllByFamily(session.tokenFamily, 'reuse_detected');
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_REUSE, 'AUTH_TOKEN_REUSE');
    }

    const account = await this.accountRepo.findById(session.accountId);
    if (!account) {
      throw new AppError(401, ErrorCodes.ACCOUNT_NOT_FOUND, 'ACCOUNT_NOT_FOUND');
    }

    if (account.currentState === 'DELETED') {
      throw new AppError(401, ErrorCodes.ACCOUNT_DELETED, 'ACCOUNT_DELETED');
    }

    if (account.currentState === 'SUSPENDED') {
      throw new AppError(403, ErrorCodes.ACCOUNT_SUSPENDED, 'ACCOUNT_SUSPENDED');
    }

    if (payload.tver !== account.tokenVersion) {
      await this.sessionRepo.revoke(session.id, 'token_version_mismatch');
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_REUSE, 'AUTH_TOKEN_REUSE');
    }

    await this.sessionRepo.revoke(session.id, 'rotated');

    const roles = account.roles.map((r) => r.role.code);

    return this.createSession(session.accountId, roles, account.tokenVersion, device);
  }

  async revokeSession(refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(tokenHash);
    if (session) {
      await this.sessionRepo.revoke(session.id, 'logout');
    }
  }

  async revokeAll(accountId: string) {
    await this.accountRepo.incrementTokenVersion(accountId);
    await this.sessionRepo.revokeAllByAccountId(accountId);
  }

  async revokeOthers(accountId: string, currentSessionId: string) {
    await this.accountRepo.incrementTokenVersion(accountId);
    await this.sessionRepo.revokeAllByAccountId(accountId, currentSessionId);
  }
}
