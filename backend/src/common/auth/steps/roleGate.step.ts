import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { enqueueAuditEvent } from '../../utils/audit.js';

export async function roleGateStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.roles) {
    throw new AppError(401, ErrorCodes.AUTH_PORTAL_MISMATCH, 'AUTH_PORTAL_MISMATCH');
  }

  const expectedRole = ctx.portal.role;
  if (!ctx.roles.includes(expectedRole)) {
    await enqueueAuditEvent('LOGIN_FAILED', ctx.accountId, {
      reason: 'portal_mismatch',
      expected: expectedRole,
      actual: ctx.roles.join(','),
    });
    throw new AppError(401, ErrorCodes.AUTH_PORTAL_MISMATCH, 'AUTH_PORTAL_MISMATCH');
  }

  return ctx;
}
