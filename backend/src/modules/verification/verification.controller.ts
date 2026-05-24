import type { Request, Response, NextFunction } from 'express';
import { VerificationService } from './verification.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { translate } from '../../common/utils/translation.js';
import { AppError } from '../../common/errors/AppError.js';
import { signVerificationToken, signResetToken } from '../../common/utils/jwt.js';
import { prisma } from '../../database/prisma.js';

export class VerificationController {
  constructor(
    private verificationService: VerificationService,
    private notificationService: NotificationService,
  ) {}

  sendRegistrationOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const otp = await this.verificationService.sendOtp('EMAIL', req.body.email, 'REGISTER');
      await this.notificationService.sendRegistrationOtpEmail(req.body.email, otp);
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  verifyRegistrationOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await this.verificationService.verifyOtp('EMAIL', req.body.email, req.body.otp, 'REGISTER');

      const token = signVerificationToken({ sub: record.id, purpose: 'register' });

      await prisma.registrationSession.create({
        data: {
          verificationId: record.id,
          snapshotTarget: req.body.email,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      sendSuccess(res, { verificationToken: token });
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

  sendPasswordResetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const otp = await this.verificationService.sendOtp('EMAIL', req.body.email, 'RESET_PASSWORD');
      await this.notificationService.sendPasswordResetOtpEmail(req.body.email, otp);
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };

  verifyPasswordResetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await this.verificationService.verifyOtp('EMAIL', req.body.email, req.body.otp, 'RESET_PASSWORD');

      const token = signResetToken({ sub: record.id, purpose: 'reset_password' });

      await prisma.resetSession.create({
        data: {
          verificationId: record.id,
          snapshotTarget: req.body.email,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      sendSuccess(res, { resetToken: token });
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
}
