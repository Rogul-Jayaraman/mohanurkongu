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

  publish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { draftId, idempotencyKey } = req.body;
      const result = await this.profileService.publish(req.account.sub, draftId, idempotencyKey);
      sendSuccess(res, result, 201);
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

  deleteActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.profileService.deleteActiveProfile(req.account.sub, req.params.id as string);
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
}
