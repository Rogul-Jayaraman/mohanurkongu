import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { StorageService } from '../storage/storage.service.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { ImagePipelineService } from '../image/image-pipeline.service.js';
import { generateUploadToken } from './public-id.helper.js';
import type { ImageCategory } from '../image/image-processor.service.js';

export class UploadService {
  constructor(
    private storageService: StorageService,
    private pipeline: ImagePipelineService,
  ) {}

  async upload(accountId: string, file: Express.Multer.File, category: string) {
    if (!file.path) {
      throw new AppError(400, ErrorCodes.UPLOAD_INVALID_TYPE, ErrorCodes.UPLOAD_INVALID_TYPE);
    }

    const validCategories: ImageCategory[] = ['profiles', 'gallery', 'horoscope'];
    const imageCategory: ImageCategory = validCategories.includes(category as ImageCategory)
      ? (category as ImageCategory)
      : 'profiles';

    const uploadToken = generateUploadToken();

    let pipelineResult;
    try {
      pipelineResult = await this.pipeline.execute({
        tempFilePath: file.path,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        category: imageCategory,
        uploadToken,
      });
    } catch (err) {
      await fs.unlink(file.path).catch(() => {});
      if (err instanceof AppError) throw err;
      throw new AppError(400, ErrorCodes.UPLOAD_INVALID_TYPE, ErrorCodes.UPLOAD_INVALID_TYPE);
    }

    const ext = path.extname(pipelineResult.outputPath).toLowerCase().replace('.', '') || 'webp';

    const destResult = await this.storageService.createFromPipeline(
      accountId,
      pipelineResult.uploadToken,
      pipelineResult.objectKey,
      pipelineResult.mimeType,
      ext,
      pipelineResult.size,
      pipelineResult.checksum,
      pipelineResult.width,
      pipelineResult.height,
      pipelineResult.outputPath,
    );

    try {
      await fs.unlink(file.path).catch(() => {});
      const tempDir = path.dirname(file.path);
      if (tempDir.startsWith(os.tmpdir())) {
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
