import type { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';

export class ProfileController {
  constructor(
    private profileService: ProfileService,
  ) {}

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
      const q = req.query.q as string | undefined;
      const result = await this.profileService.getMyProfiles(req.account.sub, q);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  browse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.browseProfiles(req.account.sub, req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  toggleShortlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.params.id as string;
      const action = req.body.action as string;
      const result = await this.profileService.toggleShortlist(req.account.sub, profileId, action as 'add' | 'remove');
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  viewShortlisted = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.fetchShortlisted(req.account.sub, req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  showcase = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.getShowcaseProfiles();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  viewProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.getProfile(req.account.sub, req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

}
