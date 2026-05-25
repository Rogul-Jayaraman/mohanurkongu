import fs from 'node:fs';

export interface IStorageProvider {
  upload(filePath: string, objectKey: string, mimeType: string): Promise<string>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
  move(sourceKey: string, destKey: string): Promise<string>;
  stream(objectKey: string): Promise<fs.ReadStream>;
  getObjectPath(objectKey: string): string;
}
