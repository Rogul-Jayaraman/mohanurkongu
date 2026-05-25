import path from 'node:path';
import fs from 'node:fs/promises';
import { StorageService } from '../storage/storage.service.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { ImagePipelineService } from '../image/image-pipeline.service.js';
import type { ImageCategory } from '../image/image-processor.service.js';

export class UploadService {
  constructor(
    private storageService: StorageService,
    private pipeline: ImagePipelineService,
  ) {}

  async upload(accountId: string, file: Express.Multer.File, category: string) {
    if (!file.path) {
      throw new AppError(400, ErrorCodes.UPLOAD_INVALID_TYPE, 'File path is missing');
    }

    const validCategories: ImageCategory[] = ['profiles', 'gallery', 'horoscope'];
    const imageCategory: ImageCategory = validCategories.includes(category as ImageCategory)
      ? (category as ImageCategory)
      : 'profiles';

    let pipelineResult;
    try {
      pipelineResult = await this.pipeline.execute({
        tempFilePath: file.path,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        category: imageCategory,
      });
    } catch (err) {
      await fs.unlink(file.path).catch(() => {});
      if (err instanceof AppError) throw err;
      throw new AppError(400, ErrorCodes.UPLOAD_INVALID_TYPE, (err as Error).message || 'Image validation failed');
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '') || 'jpg';

    const tempDir = path.dirname(file.path);
    const destResult = await this.storageService.createFromPipeline(
      accountId,
      file.originalname,
      pipelineResult.mimeType,
      ext,
      pipelineResult.size,
      pipelineResult.checksum,
      pipelineResult.objectKey,
      pipelineResult.outputPath,
    );

    try {
      await fs.unlink(file.path).catch(() => {});
      if (tempDir.startsWith(require('os').tmpdir())) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    } catch {}

    await this.pipeline.cleanup(pipelineResult);

    return destResult;
  }

  async delete(uploadId: string, accountId: string) {
    await this.storageService.delete(uploadId, accountId);
  }
}

