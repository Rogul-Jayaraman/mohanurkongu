import type { PipelineContext } from '../types.js';
import { prisma } from '../../../database/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';

/**
 * Ensure ctx.accountId is set for password reset.
 * After the reset session resolution we have ctx.email.
 * If the accountId is not already present, look up the account via the email.
 */
export function createResolveAccountForResetStep() {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (ctx.accountId) return ctx;
    if (!ctx.email) {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    const account = await prisma.account.findFirst({
      where: { credential: { email: ctx.email } },
    });

    if (!account) {
      throw new AppError(400, ErrorCodes.AUTH_RESET_SESSION_INVALID, 'AUTH_RESET_SESSION_INVALID');
    }

    ctx.accountId = account.id;
    return ctx;
  };
}
