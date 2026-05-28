import { SessionRepository } from './session.repository.js';
import { AccountRepository } from '../account/account.repository.js';
import { authConfig } from '../../config/auth.config.js';
import { signRefreshToken, signAccessToken, verifyRefreshToken, type AccessTokenPayload } from '../../common/utils/jwt.js';
import { sha256 } from '../../common/utils/hash.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { prisma } from '../../database/prisma.js';
import { enqueueAuditEvent } from '../../common/utils/audit.js';
import type { DeviceInfo } from '../../common/utils/device.js';
import type { Prisma } from '@prisma/client';

export class SessionService {
  constructor(
    private sessionRepo: SessionRepository,
    private accountRepo: AccountRepository,
  ) {}

  async createSession(accountId: string, roles: string[], tokenVersion: number, device?: DeviceInfo, tx?: Prisma.TransactionClient) {
    const refreshPayload = {
      sub: accountId,
      jti: crypto.randomUUID(),
      tver: tokenVersion,
    };
    const refreshToken = signRefreshToken(refreshPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = tx
      ? await this.createSessionTx(tx, accountId, refreshToken, tokenVersion, device, expiresAt)
      : await prisma.$transaction((tx) =>
          this.createSessionTx(tx, accountId, refreshToken, tokenVersion, device, expiresAt),
        );

    const accessPayload: Omit<AccessTokenPayload, 'type'> = {
      sub: accountId,
      roles,
      tver: tokenVersion,
    };
    const accessToken = signAccessToken(accessPayload);

    return { accessToken, refreshToken, sessionId: session.id };
  }

  private async createSessionTx(
    tx: Prisma.TransactionClient,
    accountId: string,
    refreshToken: string,
    tokenVersion: number,
    device: DeviceInfo | undefined,
    expiresAt: Date,
  ) {
    const tokenFamily = crypto.randomUUID();

    const created = await tx.accountSession.create({
      data: {
        accountId,
        refreshTokenHash: sha256(refreshToken),
        tokenFamily,
        tokenVersion,
        ipHash: device?.ipHash,
        userAgentHash: device?.userAgentHash,
        deviceFingerprint: device?.fingerprint,
        expiresAt,
      },
    });

    const active = await tx.accountSession.count({
      where: { accountId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (active > authConfig.session.maxActive) {
      const oldest = await tx.accountSession.findFirst({
        where: { accountId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'asc' },
      });
      if (oldest) {
        await tx.accountSession.update({
          where: { id: oldest.id },
          data: { revokedAt: new Date(), revokedReason: 'max_sessions_exceeded' },
        });
      }
    }

    return created;
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

    const account = await this.accountRepo.findById(session.accountId);
    if (!account) {
      throw new AppError(401, ErrorCodes.ACCOUNT_NOT_FOUND, 'ACCOUNT_NOT_FOUND');
    }

    if (account.currentState === 'SUSPENDED') {
      throw new AppError(403, ErrorCodes.ACCOUNT_SUSPENDED, 'ACCOUNT_SUSPENDED');
    }

    if (payload.tver !== account.tokenVersion) {
      await this.sessionRepo.revoke(session.id, 'token_version_mismatch');
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_REUSE, 'AUTH_TOKEN_REUSE');
    }

    const won = await this.sessionRepo.tryAtomicRevoke(session.id, 'rotated');
    if (!won) {
      await this.sessionRepo.revokeAllByFamily(session.tokenFamily, 'reuse_detected');
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_REUSE, 'AUTH_TOKEN_REUSE');
    }

    const roles = account.roles.map((r) => r.role.code);

    return this.createSession(session.accountId, roles, account.tokenVersion, device);
  }

  async revokeSession(refreshToken: string, auditEvent?: string) {
    const tokenHash = sha256(refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(tokenHash);
    if (session) {
      await this.sessionRepo.revoke(session.id, 'logout');
      if (auditEvent) {
        await enqueueAuditEvent(auditEvent, session.accountId, { sessionId: session.id });
      }
    }
  }

  async revokeAll(accountId: string) {
    await this.accountRepo.incrementTokenVersion(accountId);
    const count = await this.sessionRepo.revokeAllByAccountId(accountId);
    await enqueueAuditEvent('SESSION_REVOKE_ALL', accountId, { count });
  }

  async revokeOthers(accountId: string, currentSessionId: string) {
    await this.accountRepo.incrementTokenVersion(accountId);
    const count = await this.sessionRepo.revokeAllByAccountId(accountId, currentSessionId);
    await enqueueAuditEvent('SESSION_REVOKE_OTHERS', accountId, { count });
  }
}
