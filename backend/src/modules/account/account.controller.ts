import type { Request, Response, NextFunction } from 'express';
import { AccountService } from './account.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class AccountController {
  constructor(private accountService: AccountService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.accountService.getProfile(req.account.sub);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.accountService.updateProfile(req.account.sub, req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.accountService.changePassword(
        req.account.sub,
        req.body,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
