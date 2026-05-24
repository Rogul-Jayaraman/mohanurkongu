import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { getDeviceInfo } from '../../common/utils/device.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { translate } from '../../common/utils/translation.js';
import { AppError } from '../../common/errors/AppError.js';
import { setCsrfCookie } from '../../common/middleware/csrf.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: req.app.get('env') === 'production',
          sameSite: 'strict',
          path: '/auth',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        setCsrfCookie(res);
      }

      sendSuccess(res, {
        accessToken: result.accessToken,
        sessionId: result.sessionId,
      }, 201);
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
      setCsrfCookie(res);

      sendSuccess(res, {
        accessToken: result.accessToken,
        sessionId: result.sessionId,
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
      setCsrfCookie(res);

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
      res.clearCookie('csrf-token', { path: '/' });
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.logoutAll(req.account.sub);
      res.clearCookie('refreshToken', { path: '/auth' });
      res.clearCookie('csrf-token', { path: '/' });
      sendSuccess(res, null);
    } catch (err) {
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
}
