import type { Request, Response, NextFunction } from 'express';
import type { AdminVerificationService } from './admin-verification.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

export class AdminVerificationController {
  constructor(private readonly verificationService: AdminVerificationService) {}

  getQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const result = await this.verificationService.getQueue({ page, limit, search });
      sendSuccess(res, {
        profiles: result.profiles,
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

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const ipAddress = req.ip;
      const result = await this.verificationService.approveProfile(adminId, profileId, ipAddress);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lang = res.locals.lang || 'en';
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const ipAddress = req.ip;
      const { reasonEn, reasonTa } = req.body;

      if (!reasonEn || reasonEn.trim().length === 0) {
        throw new AppError(400, ErrorCodes.VERIFICATION_REASON_REQUIRED, ErrorCodes.VERIFICATION_REASON_REQUIRED);
      }

      const result = await this.verificationService.rejectProfile(
        adminId, profileId, { reasonEn, reasonTa }, ipAddress,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.verificationService.getStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  };

  claim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const result = await this.verificationService.claimQueue(profileId, adminId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  unclaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const result = await this.verificationService.unclaimQueue(profileId, adminId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
