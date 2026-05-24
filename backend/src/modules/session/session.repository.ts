import { prisma } from '../../database/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { sha256 } from '../../common/utils/hash.js';

export interface CreateSessionData {
  accountId: string;
  refreshToken: string;
  tokenVersion: number;
  ipHash?: string;
  userAgentHash?: string;
  deviceFingerprint?: string;
  expiresAt: Date;
}

export class SessionRepository {
  async create(data: CreateSessionData) {
    const tokenFamily = uuidv4();
    return prisma.accountSession.create({
      data: {
        accountId: data.accountId,
        refreshTokenHash: sha256(data.refreshToken),
        tokenFamily,
        tokenVersion: data.tokenVersion,
        ipHash: data.ipHash,
        userAgentHash: data.userAgentHash,
        deviceFingerprint: data.deviceFingerprint,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByRefreshTokenHash(tokenHash: string) {
    return prisma.accountSession.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
    });
  }

  async findById(id: string) {
    return prisma.accountSession.findUnique({ where: { id } });
  }

  async revoke(id: string, reason?: string) {
    return prisma.accountSession.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokedReason: reason || 'revoked',
      },
    });
  }

  async tryAtomicRevoke(id: string, reason?: string): Promise<boolean> {
    const result = await prisma.accountSession.updateMany({
      where: { id, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedReason: reason || 'rotated',
      },
    });
    return result.count > 0;
  }

  async revokeAllByFamily(tokenFamily: string, reason?: string) {
    const result = await prisma.accountSession.updateMany({
      where: { tokenFamily },
      data: {
        revokedAt: new Date(),
        revokedReason: reason || 'family_revoked',
      },
    });
    return result.count;
  }

  async revokeAllByAccountId(accountId: string, excludeId?: string) {
    const where: any = { accountId, revokedAt: null };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const result = await prisma.accountSession.updateMany({
      where,
      data: {
        revokedAt: new Date(),
        revokedReason: excludeId ? 'logout_others' : 'logout_all',
      },
    });
    return result.count;
  }

  async countActiveByAccountId(accountId: string) {
    return prisma.accountSession.count({
      where: { accountId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async findOldestActive(accountId: string) {
    return prisma.accountSession.findFirst({
      where: { accountId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async expireSessions() {
    const result = await prisma.accountSession.updateMany({
      where: { expiresAt: { lt: new Date() }, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'expired' },
    });
    return result.count;
  }
}
