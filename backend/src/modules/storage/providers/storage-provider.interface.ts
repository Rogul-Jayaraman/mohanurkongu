export interface IStorageProvider {
  upload(filePath: string, objectKey: string, mimeType: string): Promise<string>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
}
