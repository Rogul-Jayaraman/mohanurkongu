import type { Request, Response, NextFunction } from 'express';
import { AccountRepository } from '../account/account.repository.js';
import { sendSuccess, sendPaginated } from '../../common/responses/ApiResponse.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { translate } from '../../common/utils/translation.js';
import { enqueueAuditEvent } from '../../common/utils/audit.js';

export class AdminAccountController {
  constructor(private accountRepo: AccountRepository) {}

  listAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const result = await this.accountRepo.listAccounts(page, limit, search);
      sendPaginated(res, result.data, result.total, page, limit);
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
      const { reason } = req.body;
      await this.accountRepo.updateState(id, 'SUSPENDED', reason || 'Suspended by admin', req.account.sub);
      await enqueueAuditEvent('ACCOUNT_SUSPEND', id, { by: req.account.sub, reason });
      sendSuccess(res, null);
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
      await this.accountRepo.updateState(id, 'ACTIVE', 'Restored by admin', req.account.sub);
      await enqueueAuditEvent('ACCOUNT_RESTORE', id, { by: req.account.sub });
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };
}
