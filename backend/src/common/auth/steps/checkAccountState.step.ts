import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';

export async function checkAccountStateStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.credential) {
    throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
  }

  if (ctx.credential.account.currentState === 'SUSPENDED') {
    throw new AppError(403, ErrorCodes.AUTH_ACCOUNT_SUSPENDED, 'AUTH_ACCOUNT_SUSPENDED');
  }

  if (ctx.credential.lockedUntil && ctx.credential.lockedUntil > new Date()) {
    throw new AppError(429, ErrorCodes.AUTH_ACCOUNT_LOCKED, 'AUTH_ACCOUNT_LOCKED');
  }

  if (ctx.credential.failedLoginCount >= 3) {
    const delay = (ctx.credential.failedLoginCount - 3) * 500;
    await new Promise((r) => setTimeout(r, delay));
  }

  ctx.roles = ctx.credential.account.roles.map((r: { role: { code: string } }) => r.role.code);
  ctx.tokenVersion = ctx.credential.account.tokenVersion;
  ctx.accountId = ctx.credential.accountId;
  ctx.email = ctx.credential.email;
  ctx.phone = ctx.credential.phone;

  return ctx;
}
