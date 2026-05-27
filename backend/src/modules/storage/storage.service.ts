import { StorageRepository } from './storage.repository.js';
import type { IStorageProvider } from './providers/storage-provider.interface.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

export interface CreateFromPipelineResult {
  uploadToken: string;
  url: string;
  width: number;
  height: number;
}

export class StorageService {
  constructor(
    private provider: IStorageProvider,
    private repo: StorageRepository,
  ) {}

  async createFromPipeline(
    accountId: string,
    uploadToken: string,
    objectKey: string,
    mimeType: string,
    ext: string,
    size: number,
    checksum: string,
    width: number,
    height: number,
    outputPath: string,
  ): Promise<CreateFromPipelineResult> {
    await this.provider.upload(outputPath, objectKey, mimeType);
    const upload = await this.repo.create({
      uploadToken,
      ownerAccountId: accountId,
      objectKey,
      size,
      checksum,
      status: 'TEMP' as any,
      width,
      height,
    });
    return {
      uploadToken: upload.uploadToken!,
      url: `/media/${objectKey}`,
      width,
      height,
    };
  }

  async delete(uploadId: string, accountId: string): Promise<void> {
    const upload = uploadId.startsWith('upl_')
      ? await this.repo.findByUploadToken(uploadId.toLowerCase())
      : await this.repo.findById(uploadId);
    if (!upload) throw new AppError(404, ErrorCodes.UPLOAD_NOT_FOUND, ErrorCodes.UPLOAD_NOT_FOUND);
    if (upload.ownerAccountId !== accountId) throw new AppError(403, ErrorCodes.AUTH_FORBIDDEN, ErrorCodes.AUTH_FORBIDDEN);
    if (upload.status === 'DELETED') throw new AppError(400, ErrorCodes.UPLOAD_DELETED, ErrorCodes.UPLOAD_DELETED);

    await this.repo.updateStatus(upload.id, 'DELETE_PENDING');
  }

  async bulkTransitionStatus(uploadIds: string[], fromStatuses: string[], toStatus: string, tx?: any): Promise<void> {
    const result = await this.repo.bulkUpdateStatus(uploadIds, toStatus, fromStatuses, tx);
    if (result.count !== uploadIds.length) {
      throw new AppError(400, ErrorCodes.UPLOAD_INVALID_STATUS, ErrorCodes.UPLOAD_INVALID_STATUS);
    }
  }

  async findExpiredTemp(hours: number) {
    return this.repo.findExpiredTemp(hours);
  }

  async findExpiredDraftProfiles(days: number) {
    return this.repo.findExpiredDraftProfiles(days);
  }

  async findDeletePendingBatch(limit: number) {
    return this.repo.findDeletePendingBatch(limit);
  }

  async recordCleanupAttempt(id: string, error?: string): Promise<void> {
    const upload = await this.repo.findById(id);
    if (!upload) return;
    const attempts = upload.cleanupAttempts + 1;
    if (error) {
      await this.repo.updateCleanupFailure(id, attempts, error);
    } else {
      await this.repo.markDeleted(id);
    }
  }
}
