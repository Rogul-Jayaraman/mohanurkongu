import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { logger } from '../common/utils/logger.js';

export async function expireRegistrationSessions(): Promise<void> {
  const sessions = await prisma.registrationSession.findMany({
    where: { usedAt: null, expiresAt: { lt: new Date() } },
    select: { id: true, verificationId: true },
  });

  if (sessions.length === 0) return;

  const ids = sessions.map(s => s.id);
  const verificationIds = sessions.map(s => s.verificationId);

  await prisma.registrationSession.deleteMany({ where: { id: { in: ids } } });

  const updated = await prisma.accountVerification.updateMany({
    where: { id: { in: verificationIds }, state: 'VERIFIED' },
    data: { state: 'EXPIRED' },
  });

  logger.info({ deleted: ids.length, expired: updated.count }, 'Expired registration sessions');
}

export async function expireResetSessions(): Promise<void> {
  try {
    const sessions = await prisma.resetSession.findMany({
      where: { usedAt: null, expiresAt: { lt: new Date() } },
      select: { id: true, verificationId: true },
    });

    if (sessions.length === 0) return;

    const ids = sessions.map(s => s.id);
    const verificationIds = sessions.map(s => s.verificationId);

    await prisma.resetSession.deleteMany({ where: { id: { in: ids } } });

    const updated = await prisma.accountVerification.updateMany({
      where: { id: { in: verificationIds }, state: 'VERIFIED' },
      data: { state: 'EXPIRED' },
    });

    logger.info({ deleted: ids.length, expired: updated.count }, 'Expired reset sessions');
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      logger.error({ table: err.meta?.table }, 'reset_sessions table does not exist — run pending migrations');
    } else {
      logger.error({ err }, 'Failed to expire reset sessions');
    }
  }
}
