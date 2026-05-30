import type { Request, Response, NextFunction } from 'express';
import type { AdminProfilesService } from './admin-profiles.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

export class AdminProfilesController {
  constructor(private readonly adminProfilesService: AdminProfilesService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const result = await this.adminProfilesService.listProfiles({ page, limit, search, status });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const result = await this.adminProfilesService.getProfileDetail(profileId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const ipAddress = req.ip;
      const result = await this.adminProfilesService.updateProfile(adminId, profileId, req.body, ipAddress);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const ipAddress = req.ip;
      const { reasonEn, reasonTa } = req.body;

      if (!reasonEn || reasonEn.trim().length === 0) {
        throw new AppError(400, ErrorCodes.ARCHIVE_REASON_REQUIRED, ErrorCodes.ARCHIVE_REASON_REQUIRED);
      }

      const result = await this.adminProfilesService.archiveProfile(
        adminId, profileId, { reasonEn, reasonTa }, ipAddress,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const ipAddress = req.ip;
      const result = await this.adminProfilesService.deleteProfile(adminId, profileId, ipAddress);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const adminId = req.account.sub;
      const ipAddress = req.ip;
      const result = await this.adminProfilesService.restoreProfile(adminId, profileId, ipAddress);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
