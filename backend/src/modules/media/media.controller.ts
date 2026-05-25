import type { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service.js';

export class MediaController {
  constructor(private mediaService: MediaService) {}

  stream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadId = req.params.uploadId as string;
      const result = await this.mediaService.streamMedia(uploadId, req.account.sub);

      if ('error' in result) {
        res.status(result.error.status).json({
          success: false,
          error: { code: result.error.code, message: result.error.message },
        });
        return;
      }

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      result.stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };
}
