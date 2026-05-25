import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import crypto from 'node:crypto';

export type ImageCategory = 'profiles' | 'gallery' | 'horoscope';

interface CategoryConfig {
  maxWidth: number | null;
  maxHeight: number | null;
  maxDimension: number | null;
  quality: number;
}

const CATEGORY_CONFIGS: Record<ImageCategory, CategoryConfig> = {
  profiles: { maxWidth: 1800, maxHeight: 2400, maxDimension: null, quality: 90 },
  gallery: { maxWidth: null, maxHeight: null, maxDimension: 2200, quality: 90 },
  horoscope: { maxWidth: null, maxHeight: null, maxDimension: 3000, quality: 95 },
};

export interface ProcessResult {
  outputPath: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  checksum: string;
}

export async function processImage(
  inputPath: string,
  category: ImageCategory,
  outputDir: string,
): Promise<ProcessResult> {
  const config = CATEGORY_CONFIGS[category];
  const metadata = await sharp(inputPath).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (config.maxDimension) {
    const maxDim = config.maxDimension;
    if (originalWidth > maxDim || originalHeight > maxDim) {
      const scale = Math.min(maxDim / originalWidth, maxDim / originalHeight);
      targetWidth = Math.round(originalWidth * scale);
      targetHeight = Math.round(originalHeight * scale);
    }
  }

  if (config.maxWidth && config.maxHeight) {
    const maxPixels = config.maxWidth * config.maxHeight;
    const currentPixels = originalWidth * originalHeight;
    if (currentPixels > maxPixels) {
      const scale = Math.min(1, Math.sqrt(maxPixels / currentPixels));
      targetWidth = Math.round(originalWidth * scale);
      targetHeight = Math.round(originalHeight * scale);
    }
    if (targetWidth > config.maxWidth) {
      const scale = config.maxWidth / targetWidth;
      targetWidth = config.maxWidth;
      targetHeight = Math.round(targetHeight * scale);
    }
    if (targetHeight > config.maxHeight) {
      const scale = config.maxHeight / targetHeight;
      targetHeight = config.maxHeight;
      targetWidth = Math.round(targetWidth * scale);
    }
  }

  const outputFilename = `${crypto.randomUUID()}.webp`;
  const outputPath = path.join(outputDir, outputFilename);

  const pipeline = sharp(inputPath)
    .rotate()
    .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: config.quality, effort: 4 });

  await pipeline.toFile(outputPath);

  const stat = await fs.stat(outputPath);
  const checksum = await computeChecksum(outputPath);

  return {
    outputPath,
    mimeType: 'image/webp',
    size: stat.size,
    width: targetWidth,
    height: targetHeight,
    checksum,
  };
}

async function computeChecksum(filePath: string): Promise<string> {
  const sha256 = crypto.createHash('sha256');
  const stream = createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => sha256.update(chunk));
    stream.on('end', () => resolve(sha256.digest('hex')));
    stream.on('error', reject);
  });
}
