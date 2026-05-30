import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { verifyPassword } from '../../utils/crypto.js';
import { enqueueAuditEvent } from '../../utils/audit.js';
import type { AccountRepository } from '../../../modules/account/account.repository.js';

export function createVerifyPasswordStep(accountRepo: AccountRepository) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.credential) {
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    const password = ctx.input.password as string;
    if (!password) {
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(ctx.credential.passwordHash || '', password);
    if (!valid) {
      await accountRepo.incrementFailedLogins(ctx.credential.accountId, ctx.credential.failedLoginCount);
      await enqueueAuditEvent('LOGIN_FAILED', ctx.credential.accountId, { reason: 'invalid_password' });
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    await accountRepo.resetFailedLogins(ctx.credential.accountId);
    await enqueueAuditEvent('LOGIN_SUCCESS', ctx.credential.accountId, { device: ctx.device?.fingerprint });

    return ctx;
  };
}
