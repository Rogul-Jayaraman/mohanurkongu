import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../common/responses/ApiResponse.js';
import { getDeviceInfo } from '../../common/utils/device.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { translate } from '../../common/utils/translation.js';
import { AppError } from '../../common/errors/AppError.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  sendRegistrationOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.sendRegistrationOtp(req.body);
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  verifyRegistrationOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.verifyRegistrationOtp(req.body);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof AppError && err.code === ErrorCodes.AUTH_VERIFICATION_EXPIRED) {
        const lang = res.locals.lang || 'en';
        return res.status(410).json({
          success: false,
          code: ErrorCodes.AUTH_VERIFICATION_EXPIRED,
          message: translate(ErrorCodes.AUTH_VERIFICATION_EXPIRED, lang),
          canResend: true,
        });
      }
      next(err);
    }
  };

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.signup(req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = getDeviceInfo(req);
      const result = await this.authService.login(req.body, device);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: req.app.get('env') === 'production',
        sameSite: 'strict',
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        accessToken: result.accessToken,
        account: result.account,
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        const lang = res.locals.lang || 'en';
        throw new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, translate(ErrorCodes.AUTH_TOKEN_INVALID, lang));
      }

      const device = getDeviceInfo(req);
      const result = await this.authService.refresh(refreshToken, device);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: req.app.get('env') === 'production',
        sameSite: 'strict',
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, { accessToken: result.accessToken });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', { path: '/auth' });
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.logoutAll(req.account.sub);
      res.clearCookie('refreshToken', { path: '/auth' });
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  sendPasswordResetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.sendPasswordResetOtp(req.body);
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  verifyPasswordResetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.verifyPasswordResetOtp(req.body);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof AppError && err.code === ErrorCodes.AUTH_VERIFICATION_EXPIRED) {
        const lang = res.locals.lang || 'en';
        return res.status(410).json({
          success: false,
          code: ErrorCodes.AUTH_VERIFICATION_EXPIRED,
          message: translate(ErrorCodes.AUTH_VERIFICATION_EXPIRED, lang),
          canResend: true,
        });
      }
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.resetPassword(req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.getProfile(req.account.sub);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.changePassword(
        req.account.sub,
        req.body.currentPassword,
        req.body.newPassword,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
