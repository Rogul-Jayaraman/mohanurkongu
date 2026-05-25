import { StorageService } from '../storage/storage.service.js';

export class MediaService {
  constructor(private storageService: StorageService) {}

  async streamMedia(uploadId: string, requesterAccountId: string) {
    return this.storageService.getMediaUpload(uploadId, requesterAccountId);
  }
}
