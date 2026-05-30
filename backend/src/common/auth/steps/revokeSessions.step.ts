import type { PipelineContext } from '../types.js';
import { enqueueAuditEvent } from '../../utils/audit.js';
import { prisma } from '../../../database/prisma.js';

export async function revokeAllSessionsStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.accountId) return ctx;

  await prisma.accountSession.updateMany({
    where: { accountId: ctx.accountId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: 'password_reset' },
  });

  await enqueueAuditEvent('SESSIONS_REVOKED', ctx.accountId, { reason: 'password_reset' });

  return ctx;
}

export async function resolveAccountFromSessionStep(ctx: PipelineContext): Promise<PipelineContext> {
  const accessToken = ctx.input.accessToken as string | undefined;
  if (!accessToken) {
    throw new Error('No access token provided for account resolution');
  }

  const { verifyAccessToken } = await import('../../utils/jwt.js');
  const payload = verifyAccessToken(accessToken);

  ctx.accountId = payload.sub;
  ctx.roles = payload.roles;
  ctx.tokenVersion = payload.tver;

  return ctx;
}
