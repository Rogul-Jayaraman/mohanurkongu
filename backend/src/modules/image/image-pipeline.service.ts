import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { validateImage } from './image-validator.service.js';
import { processImage, type ImageCategory, type ProcessResult } from './image-processor.service.js';
import { heicConvert } from './heic-converter.service.js';

export interface PipelineInput {
  tempFilePath: string;
  originalFileName: string;
  mimeType: string;
  category: ImageCategory;
  uploadToken: string;
}

export interface PipelineResult {
  outputPath: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  checksum: string;
  objectKey: string;
  uploadToken: string;
}

export class ImagePipelineService {
  async execute(input: PipelineInput): Promise<PipelineResult> {
    const { tempFilePath, originalFileName, mimeType, category, uploadToken } = input;

    const validation = await validateImage(tempFilePath, originalFileName, mimeType);
    if (!validation.valid) {
      throw new AppError(400, ErrorCodes.UPLOAD_INVALID_TYPE, ErrorCodes.UPLOAD_INVALID_TYPE);
    }

    const ext = originalFileName.split('.').pop()?.toLowerCase() || '';

    let processPath = tempFilePath;

    if (ext === 'heic' || ext === 'heif') {
      processPath = await heicConvert(tempFilePath);
    }

    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-output-'));
    try {
      const result: ProcessResult = await processImage(processPath, category, outputDir);

      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const outputExt = path.extname(result.outputPath).toLowerCase().replace('.', '') || 'webp';
      const objectKey = `${category}/${year}/${month}/${uploadToken}.${outputExt}`;

      if (processPath !== tempFilePath) {
        await fs.unlink(processPath);
      }

      return {
        outputPath: result.outputPath,
        mimeType: result.mimeType,
        size: result.size,
        width: result.width,
        height: result.height,
        checksum: result.checksum,
        objectKey,
        uploadToken,
      };
    } catch (err) {
      if (processPath !== tempFilePath) {
        await fs.unlink(processPath).catch(() => {});
      }
      await fs.rm(outputDir, { recursive: true, force: true });
      throw err;
    }
  }

  async cleanup(result: PipelineResult): Promise<void> {
    try {
      await fs.unlink(result.outputPath);
      const dir = path.dirname(result.outputPath);
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }
}
