import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { enqueueAuditEvent } from '../../utils/audit.js';
import { prisma } from '../../../database/prisma.js';
import type { AccountRepository } from '../../../modules/account/account.repository.js';
import type { AccountService } from '../../../modules/account/account.service.js';

export function createCheckEmailUniquenessStep(accountRepo: AccountRepository) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.email) return ctx;

    const existing = await accountRepo.findCredentialByEmail(ctx.email);
    if (existing) {
      throw new AppError(409, ErrorCodes.AUTH_EMAIL_EXISTS, 'AUTH_EMAIL_EXISTS');
    }
    return ctx;
  };
}

export function createCreateAccountStep(accountService: AccountService) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    const passwordHash = ctx.passwordHash;
    if (!passwordHash || !ctx.email) {
      throw new Error('Missing password hash or email for account creation');
    }

    const firstNameEn = ctx.input.firstNameEn as string;
    const lastNameEn = ctx.input.lastNameEn as string;
    const firstNameTa = (ctx.input.firstNameTa as string) || firstNameEn;
    const lastNameTa = (ctx.input.lastNameTa as string) || lastNameEn;
    const phone = ctx.input.phone as string | undefined;

    const accountNo = await accountService.generateAccountNo(undefined);

    try {
      const account = await prisma.account.create({
        data: {
          accountNo,
          translations: {
            create: [
              { language: 'EN', firstName: firstNameEn, lastName: lastNameEn, isDefault: true },
              { language: 'TA', firstName: firstNameTa, lastName: lastNameTa },
            ],
          },
          credential: {
            create: {
              email: ctx.email,
              phone,
              passwordHash,
            },
          },
          statusHistory: {
            create: {
              state: 'ACTIVE',
              reason: 'Account created',
              changedBy: 'system',
            },
          },
        },
        include: {
          translations: true,
          credential: true,
          statusHistory: true,
        },
      });

      ctx.accountId = account.id;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined;
        if (target?.includes('email')) {
          throw new AppError(409, ErrorCodes.AUTH_EMAIL_EXISTS, 'AUTH_EMAIL_EXISTS');
        }
        if (target?.includes('phone')) {
          throw new AppError(409, ErrorCodes.AUTH_PHONE_EXISTS, 'AUTH_PHONE_EXISTS');
        }
      }
      throw err;
    }

    return ctx;
  };
}

export async function assignUserRoleStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.accountId) {
    throw new Error('Missing accountId for role assignment');
  }

  const userRole = await prisma.role.findUnique({ where: { code: 'USER' } });
  if (!userRole) {
    throw new AppError(500, ErrorCodes.INTERNAL_ERROR, 'Default role not configured');
  }

  await prisma.accountRole.create({
    data: { accountId: ctx.accountId, roleId: userRole.id },
  });

  ctx.roles = ['USER'];
  return ctx;
}

export async function assignFreeSubscriptionStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.accountId) return ctx;

  const freePlan = await prisma.membershipPlan.findUnique({ where: { code: 'BRONZE' } });
  if (freePlan) {
    await prisma.subscription.create({
      data: {
        accountId: ctx.accountId,
        planId: freePlan.id,
        startedAt: new Date(),
        status: 'ACTIVE',
        snapshotPlanCode: freePlan.code,
        snapshotPlanName: freePlan.displayName,
        snapshotDisplayPrice: freePlan.displayPrice,
        snapshotDurationDays: freePlan.durationDays,
        snapshotOpenLimit: freePlan.openLimit,
        snapshotShortlistLimit: freePlan.shortlistLimit,
        snapshotProfileSlotLimit: freePlan.profileSlotLimit,
        snapshotViewDetails: freePlan.viewDetails,
        snapshotPrintProfile: freePlan.printProfile,
        snapshotPrintHoroscope: freePlan.printHoroscope,
        snapshotSearchLevel: freePlan.searchLevel,
      },
    });
  }

  return ctx;
}

export async function markRegistrationSessionUsedStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.verificationId) return ctx;

  const verificationId = ctx.verificationId;

  const regSession = await prisma.registrationSession.findFirst({
    where: { verificationId, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (regSession) {
    await prisma.registrationSession.update({
      where: { id: regSession.id },
      data: { usedAt: new Date() },
    });
  }

  await prisma.accountVerification.updateMany({
    where: { id: verificationId, state: 'VERIFIED' },
    data: { state: 'ARCHIVED', consumedAt: new Date() },
  });

  if (ctx.accountId && ctx.email) {
    await prisma.accountCredential.update({
      where: { accountId: ctx.accountId },
      data: { emailVerified: true },
    });
  }

  return ctx;
}

export async function markResetSessionUsedStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.verificationId) return ctx;

  const resetSession = await prisma.resetSession.findFirst({
    where: { verificationId: ctx.verificationId, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (resetSession) {
    await prisma.resetSession.update({
      where: { id: resetSession.id },
      data: { usedAt: new Date() },
    });
  }

  return ctx;
}
