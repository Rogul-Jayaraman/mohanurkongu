import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { enqueueAuditEvent } from '../../utils/audit.js';
import type { AccountRepository } from '../../../modules/account/account.repository.js';

export function createResolveCredentialStep(accountRepo: AccountRepository) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    const identifier = ctx.input.identifier as string;
    if (!identifier) {
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail ? identifier.toLowerCase() : identifier;

    const credential = isEmail
      ? await accountRepo.findCredentialByEmail(normalizedIdentifier)
      : await accountRepo.findCredentialByPhone(normalizedIdentifier);

    if (!credential) {
      await enqueueAuditEvent('LOGIN_FAILED', undefined, { identifier: normalizedIdentifier, reason: 'account_not_found' });
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    ctx.credential = {
      accountId: credential.accountId,
      email: credential.email || '',
      phone: credential.phone || undefined,
      passwordHash: credential.passwordHash || '',
      failedLoginCount: credential.failedLoginCount,
      lockedUntil: credential.lockedUntil,
      account: {
        currentState: credential.account.currentState,
        tokenVersion: credential.account.tokenVersion,
        roles: credential.account.roles,
      },
    };

    return ctx;
  };
}
