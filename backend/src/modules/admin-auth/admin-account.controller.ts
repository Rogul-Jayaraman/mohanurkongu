import type { Request, Response, NextFunction } from 'express';
import { AccountRepository } from '../account/account.repository.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { translate } from '../../common/utils/translation.js';
import { prisma } from '../../database/prisma.js';

export class AdminAccountController {
  constructor(private accountRepo: AccountRepository) {}

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
      sendSuccess(res, account);
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
