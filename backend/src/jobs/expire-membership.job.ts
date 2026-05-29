import { prisma } from '../database/prisma.js';
import { logger } from '../common/utils/logger.js';

export async function expireMemberships(): Promise<void> {
  const now = new Date();
  const result = await prisma.subscription.updateMany({
    where: {
      expiresAt: { lte: now },
      status: 'ACTIVE',
    },
    data: { status: 'EXPIRED' },
  });
  if (result.count > 0) {
    logger.info({ count: result.count }, 'Expired memberships');
  }
}
