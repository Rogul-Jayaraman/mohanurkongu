import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { appConfig } from '../../../config/app.config.js';
import type { IStorageProvider } from './storage-provider.interface.js';

export class LocalStorageService implements IStorageProvider {
  private storageDir: string;

  constructor() {
    this.storageDir = appConfig.storageDir || path.join(process.cwd(), '..', 'storage');
  }

  async upload(filePath: string, objectKey: string, _mimeType: string): Promise<string> {
    const destPath = path.join(this.storageDir, objectKey);
    await fsp.mkdir(path.dirname(destPath), { recursive: true });
    await fsp.copyFile(filePath, destPath);
    return destPath;
  }

  async delete(objectKey: string): Promise<void> {
    const filePath = path.join(this.storageDir, objectKey);
    try {
      await fsp.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      await fsp.access(path.join(this.storageDir, objectKey));
      return true;
    } catch { return false; }
  }
}
