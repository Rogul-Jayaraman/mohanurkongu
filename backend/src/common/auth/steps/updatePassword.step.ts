import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { verifyPassword } from '../../utils/crypto.js';
import { enqueueAuditEvent } from '../../utils/audit.js';
import { prisma } from '../../../database/prisma.js';

export async function updatePasswordStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.passwordHash || !ctx.accountId) {
    throw new Error('Missing password hash or accountId for password update');
  }

  await prisma.$transaction(async (tx) => {
    await tx.accountCredential.update({
      where: { accountId: ctx.accountId! },
      data: { passwordHash: ctx.passwordHash },
    });

    await tx.account.update({
      where: { id: ctx.accountId! },
      data: { tokenVersion: { increment: 1 } },
    });
  });

  await enqueueAuditEvent('PASSWORD_UPDATED', ctx.accountId, {});

  return ctx;
}

export function createVerifyCurrentPasswordStep() {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    const currentPassword = ctx.input.currentPassword as string;

    const credential = await prisma.accountCredential.findUnique({
      where: { accountId: ctx.accountId },
    });

    if (!credential) {
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(credential.passwordHash || '', currentPassword);
    if (!valid) {
      throw new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, 'AUTH_INVALID_CREDENTIALS');
    }

    return ctx;
  };
}
