import type { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service.js';
import { sendSuccess } from '../../common/responses/ApiResponse.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

export class UploadController {
  constructor(private uploadService: UploadService) {}

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      console.log(`[upload.controller] file=${JSON.stringify({originalname:file?.originalname, size:file?.size, mimetype:file?.mimetype})}`);
      if (!file) {
        res.status(400).json({ success: false, error: { code: 'UPLOAD_INVALID_TYPE', message: 'No file provided' } });
        return;
      }
      const category = (req.body.category || 'profiles') as 'profiles' | 'gallery' | 'horoscope';
      const result = await this.uploadService.upload(req.account.sub, file, category);
      console.log(`[upload.controller] success uploadId=${result.uploadId}`);
      sendSuccess(res, { uploadId: result.uploadId }, 201);
    } catch (err) {
      console.log(`[upload.controller] CAUGHT err=`, err);
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadId = req.params.id as string;
      await this.uploadService.delete(uploadId, req.account.sub);
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  };
}
