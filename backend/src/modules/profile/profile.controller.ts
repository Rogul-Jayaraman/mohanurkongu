import type { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class ProfileController {
  constructor(private profileService: ProfileService) {}

  saveDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.saveDraft(req.account.sub, req.body);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  resumeDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.resumeDraft(req.account.sub, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  deleteDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.profileService.deleteDraft(req.account.sub, req.params.id as string);
      sendSuccess(res, null, 204);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.createProfile(req.account.sub, req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  viewMyProfiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profiles = await this.profileService.getMyProfiles(req.account.sub);
      const base = `${req.protocol}://${req.get('host')}`;
      const result = profiles.map((p: any) => ({
        ...p,
        profilePhoto: p.profilePhoto ? `${base}/media/${p.profilePhoto}` : null,
      }));
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  viewProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const base = `${req.protocol}://${req.get('host')}`;
      const result: any = await this.profileService.getProfile(req.account.sub, req.params.id as string);

      if (result.profilePhoto) {
        result.profilePhoto = `${base}/media/${result.profilePhoto}`;
      }
      if (result.gallery?.length) {
        result.gallery = result.gallery.map((id: string) => `${base}/media/${id}`);
      }
      if (result.horoscope) {
        result.horoscope.rasi = result.horoscope.rasiChartUploadId
          ? `${base}/media/${result.horoscope.rasiChartUploadId}` : null;
        result.horoscope.navamsa = result.horoscope.navamsaChartUploadId
          ? `${base}/media/${result.horoscope.navamsaChartUploadId}` : null;
        delete result.horoscope.rasiChartUploadId;
        delete result.horoscope.navamsaChartUploadId;
      }

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.approveProfile(req.account.sub, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.rejectProfile(req.account.sub, req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
