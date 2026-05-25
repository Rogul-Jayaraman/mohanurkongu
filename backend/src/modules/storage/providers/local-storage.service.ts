import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { appConfig } from '../../../config/app.config.js';
import type { IStorageProvider } from './storage-provider.interface.js';

export class LocalStorageService implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = appConfig.uploadDir || path.join(process.cwd(), '..', 'storage');
  }

  async upload(filePath: string, objectKey: string, _mimeType: string): Promise<string> {
    const destPath = path.join(this.uploadDir, objectKey);
    await fsp.mkdir(path.dirname(destPath), { recursive: true });
    await fsp.copyFile(filePath, destPath);
    return destPath;
  }

  async delete(objectKey: string): Promise<void> {
    const filePath = path.join(this.uploadDir, objectKey);
    try {
      await fsp.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      await fsp.access(path.join(this.uploadDir, objectKey));
      return true;
    } catch { return false; }
  }

  async move(sourceKey: string, destKey: string): Promise<string> {
    const srcPath = path.join(this.uploadDir, sourceKey);
    const destPath = path.join(this.uploadDir, destKey);
    await fsp.mkdir(path.dirname(destPath), { recursive: true });
    await fsp.rename(srcPath, destPath);
    return destPath;
  }

  async stream(objectKey: string): Promise<fs.ReadStream> {
    const filePath = path.join(this.uploadDir, objectKey);
    return fs.createReadStream(filePath);
  }

  getObjectPath(objectKey: string): string {
    return path.join(this.uploadDir, objectKey);
  }
}
