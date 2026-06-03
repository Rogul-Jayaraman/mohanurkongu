import type { PipelineContext } from '../types.js';
import { prisma } from '../../../database/prisma.js';

/**
 * Resolve the email address from a registration session.
 * The verification token validation step stores the verificationId in the context.
 * This step looks up the corresponding registrationSession (snapshotTarget) and
 * populates ctx.email so that later steps can perform uniqueness checks and
 * account creation.
 */
export function createResolveRegistrationSessionStep() {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.verificationId) return ctx;

    const regSession = await prisma.registrationSession.findFirst({
      where: {
        verificationId: ctx.verificationId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!regSession) {
      // If the session cannot be found, the token is likely invalid or expired.
      throw new Error('Registration session not found for verificationId');
    }

    ctx.email = regSession.snapshotTarget as string;
    return ctx;
  };
}
