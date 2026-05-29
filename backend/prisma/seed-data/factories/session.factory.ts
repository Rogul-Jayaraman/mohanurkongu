import type { PrismaClient } from '@prisma/client';
import { SEED_CONFIG } from '../config.js';
import {
  randomInt, randomDateBefore, randomBool,
  pickRandom, progressBar, random,
} from '../helpers.js';

function simHash(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `sim_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

function genToken(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 16; i++) s += chars[Math.floor(random() * chars.length)];
  return `${prefix}_${s}`;
}

export async function seedSessions(
  prisma: PrismaClient,
  accountIndex: Record<number, any>,
  targetCount: number,
): Promise<void> {
  const accountIds = Object.values(accountIndex).map((ai: any) => ai.account.id);
  let created = 0;

  for (const accountId of accountIds) {
    if (created >= targetCount) break;

    const sessionCount = randomInt(0, 5);
    for (let s = 0; s < sessionCount; s++) {
      if (created >= targetCount) break;

      const createdAt = randomDateBefore(new Date(), randomInt(1, 90));
      const expiresAt = new Date(createdAt.getTime() + randomInt(1, 30) * 86400000);
      const tokenFamily = genToken('fam');
      const refreshToken = genToken('rt');

      const isRevoked = randomBool(SEED_CONFIG.SESSION_REVOKE_PCT * 100);
      const isExpired = randomBool(SEED_CONFIG.SESSION_EXPIRED_PCT * 100);

      await prisma.accountSession.create({
        data: {
          accountId,
          refreshTokenHash: simHash(refreshToken),
          tokenFamily,
          tokenVersion: 0,
          userAgentHash: randomBool(80) ? simHash(`Mozilla/5.0 ${genToken('ua')}`) : null,
          ipHash: randomBool(80) ? simHash(`${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`) : null,
          expiresAt: isExpired
            ? new Date(Date.now() - randomInt(1, 10) * 86400000)
            : expiresAt,
          revokedAt: isRevoked ? randomDateBefore(new Date(), randomInt(1, 15)) : null,
          revokedReason: isRevoked ? pickRandom(['logout', 'rotation', 'admin_revoke', 'security']) : null,
          createdAt,
        },
      });
      created++;
    }
  }

  progressBar(created, targetCount, 'Sessions');
}
