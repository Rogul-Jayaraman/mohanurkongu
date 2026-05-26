import type { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from './admin-auth.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { getDeviceInfo } from '../../common/utils/device.js';

export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = getDeviceInfo(req);
      const result = await this.adminAuthService.login(req.body, device);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: req.app.get('env') === 'production',
        sameSite: 'strict',
        path: '/admin/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      sendSuccess(res, {
        accessToken: result.accessToken,
        accountId: result.accountId,
        role: result.role,
        sessionId: result.sessionId,
      });
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminAuthService.getProfile(req.account.sub);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
