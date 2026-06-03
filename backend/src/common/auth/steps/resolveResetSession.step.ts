import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { prisma } from '../../../database/prisma.js';

/**
 * Resolve the accountId for a password reset.
 * The verification token validation step stores ctx.verificationId.
 * This step verifies the reset session is still valid and populates
 * ctx.email / ctx.accountId for the password update step.
 */
export function createResolveResetSessionStep() {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.verificationId) return ctx;

    const resetSession = await prisma.resetSession.findFirst({
      where: {
        verificationId: ctx.verificationId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetSession) {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    const verification = await prisma.accountVerification.findUnique({
      where: { id: ctx.verificationId },
    });

    if (!verification) {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    ctx.email = verification.target as string;
    if (verification.accountId) {
      ctx.accountId = verification.accountId;
    }
    return ctx;
  };
}
