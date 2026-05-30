import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { clearRefreshCookie } from '../../common/utils/cookie.js';
import type { AccountService } from '../account/account.service.js';

export class AdminAuthController {
  constructor(
    private authController: import('../auth/auth.controller.js').AuthController,
    private accountService: AccountService,
  ) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authController.adminLogin(req, res, next);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authController.adminRefresh(req, res, next);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authController.adminLogout(req, res, next);
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.accountService.getProfile(req.account.sub);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
