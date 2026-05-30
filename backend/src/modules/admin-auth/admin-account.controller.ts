import type { Request, Response, NextFunction } from 'express';
import { AccountRepository } from '../account/account.repository.js';
import { MembershipService } from '../membership/membership.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { translate } from '../../common/utils/translation.js';
import { prisma } from '../../database/prisma.js';

export class AdminAccountController {
  constructor(
    private accountRepo: AccountRepository,
    private membershipService: MembershipService,
  ) {}

  listAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const result = await this.accountRepo.listAccounts(page, limit, search);
      sendSuccess(res, {
        accounts: result.accounts,
        meta: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getAccountDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const account = await this.accountRepo.findById(id);
      if (!account) {
        const lang = res.locals.lang || 'en';
        throw new AppError(404, ErrorCodes.ACCOUNT_NOT_FOUND, translate(ErrorCodes.ACCOUNT_NOT_FOUND, lang));
      }

      const [subscription, capabilities, history, activePlans, revertableSubscription, profiles, shortlistRows] = await Promise.all([
        this.membershipService.getUserSubscription(id),
        this.membershipService.resolveCapabilities(id),
        this.membershipService.getSubscriptionHistory(id),
        this.membershipService.getActivePlans(),
        this.membershipService.getPreviousSubscription(id),
        prisma.profile.findMany({
          where: { accountId: id, currentStatus: { not: 'DELETED' } },
          orderBy: { updatedAt: 'desc' },
          include: {
            photo: {
              include: {
                primaryUpload: { select: { objectKey: true, width: true, height: true } },
              },
            },
            translations: { where: { language: 'EN' }, take: 1 },
          },
        }),
        prisma.shortlist.findMany({
          where: { accountId: id },
          orderBy: { createdAt: 'desc' },
          include: {
            profile: {
              include: {
                photo: {
                  include: {
                    primaryUpload: { select: { objectKey: true, width: true, height: true } },
                  },
                },
                translations: { where: { language: 'EN' }, take: 1 },
              },
            },
          },
        }),
      ]);

      sendSuccess(res, {
        account,
        subscription,
        capabilities,
        history,
        revertableSubscription,
        availablePlans: activePlans,
        profiles: (profiles as any[]).map((p) => ({
          id: p.id,
          regNo: p.regNo,
          firstNameEn: p.translations?.[0]?.firstName ?? null,
          lastNameEn: p.translations?.[0]?.lastName ?? null,
          currentStatus: p.currentStatus,
          gender: p.gender,
          createdAt: p.createdAt.toISOString(),
          photo: p.photo?.primaryUpload?.objectKey
            ? { url: `/media/${p.photo.primaryUpload.objectKey}`, width: p.photo.primaryUpload.width, height: p.photo.primaryUpload.height }
            : null,
        })),
        shortlistedProfiles: (shortlistRows as any[]).map((s) => {
          const p = s.profile;
          return {
            id: p.id,
            regNo: p.regNo,
            firstNameEn: p.translations?.[0]?.firstName ?? null,
            lastNameEn: p.translations?.[0]?.lastName ?? null,
            currentStatus: p.currentStatus,
            shortlistedAt: s.createdAt.toISOString(),
            photo: p.photo?.primaryUpload?.objectKey
              ? { url: `/media/${p.photo.primaryUpload.objectKey}`, width: p.photo.primaryUpload.width, height: p.photo.primaryUpload.height }
              : null,
          };
        }),
      });
    } catch (err) {
      next(err);
    }
  };

  suspendAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const account = await this.accountRepo.findById(id);
      if (!account) {
        const lang = res.locals.lang || 'en';
        throw new AppError(404, ErrorCodes.ACCOUNT_NOT_FOUND, translate(ErrorCodes.ACCOUNT_NOT_FOUND, lang));
      }
      if (account.currentState === 'SUSPENDED') {
        const lang = res.locals.lang || 'en';
        throw new AppError(400, ErrorCodes.ACCOUNT_ALREADY_SUSPENDED, translate(ErrorCodes.ACCOUNT_ALREADY_SUSPENDED, lang));
      }
      const { reasonEn, reasonTa } = req.body;
      const reason = reasonEn || reasonTa || 'Suspended by admin';
      await this.accountRepo.updateState(id, 'SUSPENDED', reason, req.account.sub);
      await prisma.adminAuditEvent.create({
        data: { actorId: req.account.sub, action: 'ACCOUNT_SUSPEND', ipAddress: req.ip || null },
      });
      sendSuccess(res, { accountId: id, status: 'SUSPENDED' });
    } catch (err) {
      next(err);
    }
  };

  restoreAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const account = await this.accountRepo.findById(id);
      if (!account) {
        const lang = res.locals.lang || 'en';
        throw new AppError(404, ErrorCodes.ACCOUNT_NOT_FOUND, translate(ErrorCodes.ACCOUNT_NOT_FOUND, lang));
      }
      if (account.currentState === 'ACTIVE') {
        const lang = res.locals.lang || 'en';
        throw new AppError(400, ErrorCodes.ACCOUNT_ALREADY_ACTIVE, translate(ErrorCodes.ACCOUNT_ALREADY_ACTIVE, lang));
      }
      await this.accountRepo.updateState(id, 'ACTIVE', 'Restored by admin', req.account.sub);
      await prisma.adminAuditEvent.create({
        data: { actorId: req.account.sub, action: 'ACCOUNT_RESTORE', ipAddress: req.ip || null },
      });
      sendSuccess(res, { accountId: id, status: 'ACTIVE' });
    } catch (err) {
      next(err);
    }
  };
}
