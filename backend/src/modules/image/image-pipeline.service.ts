import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { validateImage } from './image-validator.service.js';
import { processImage, type ImageCategory, type ProcessResult } from './image-processor.service.js';
import { heicConvert } from './heic-converter.service.js';

export interface PipelineInput {
  tempFilePath: string;
  originalFileName: string;
  mimeType: string;
  category: ImageCategory;
}

export interface PipelineResult {
  outputPath: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  checksum: string;
  objectKey: string;
}

export class ImagePipelineService {
  async execute(input: PipelineInput): Promise<PipelineResult> {
    const { tempFilePath, originalFileName, mimeType, category } = input;

    const validation = await validateImage(tempFilePath, originalFileName, mimeType);
    if (!validation.valid) {
      throw new Error(validation.error || 'Validation failed');
    }

    const ext = originalFileName.split('.').pop()?.toLowerCase() || '';

    let processPath = tempFilePath;

    if (ext === 'heic' || ext === 'heif') {
      processPath = await heicConvert(tempFilePath);
    }

    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-output-'));
    try {
      const result: ProcessResult = await processImage(processPath, category, outputDir);

      const objectKey = `${category}/${path.basename(result.outputPath)}`;

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
      };
    } catch (err) {
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
