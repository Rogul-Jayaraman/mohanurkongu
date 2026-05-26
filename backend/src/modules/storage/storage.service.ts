import { StorageRepository } from './storage.repository.js';
import type { IStorageProvider } from './providers/storage-provider.interface.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { generatePublicId } from '../upload/public-id.helper.js';

export class StorageService {
  constructor(
    private provider: IStorageProvider,
    private repo: StorageRepository,
  ) {}

  async createFromPipeline(
    accountId: string,
    originalFileName: string,
    mimeType: string,
    extension: string,
    size: number,
    checksum: string,
    objectKey: string,
    outputPath: string,
  ): Promise<{ uploadId: string }> {
    const publicId = generatePublicId();
    await this.provider.upload(outputPath, objectKey, mimeType);
    const upload = await this.repo.create({
      publicId,
      ownerAccountId: accountId,
      objectKey,
      originalFileName,
      mimeType,
      extension,
      size,
      checksum,
    });
    return { uploadId: upload.id };
  }

  async delete(uploadId: string, accountId: string): Promise<void> {
    const upload = await this.repo.findById(uploadId);
    if (!upload) throw new AppError(404, ErrorCodes.UPLOAD_NOT_FOUND, 'Upload not found');
    if (upload.ownerAccountId !== accountId) throw new AppError(403, ErrorCodes.AUTH_FORBIDDEN, 'Forbidden');
    if (upload.status === 'ACTIVE') throw new AppError(400, ErrorCodes.UPLOAD_ACTIVE, 'Cannot delete published upload');
    if (upload.status === 'DELETED') throw new AppError(400, ErrorCodes.UPLOAD_DELETED, 'Upload already deleted');

    await this.provider.delete(upload.objectKey);
    await this.repo.deleteMany([uploadId]);
  }

  async transitionStatus(uploadId: string, fromStatuses: string[], toStatus: string): Promise<void> {
    const upload = await this.repo.findById(uploadId);
    if (!upload) throw new AppError(404, ErrorCodes.UPLOAD_NOT_FOUND, 'Upload not found');
    if (!fromStatuses.includes(upload.status)) throw new AppError(400, 'UPLOAD_INVALID_STATUS', `Cannot transition from ${upload.status}`);
    await this.repo.updateStatus(uploadId, toStatus);
  }

  async bulkTransitionStatus(uploadIds: string[], fromStatuses: string[], toStatus: string, tx?: any): Promise<void> {
    const result = await this.repo.bulkUpdateStatus(uploadIds, toStatus, fromStatuses, tx);
    if (result.count !== uploadIds.length) {
      throw new AppError(400, ErrorCodes.UPLOAD_INVALID_STATUS,
        `${uploadIds.length - result.count} upload(s) skipped due to status mismatch`);
    }
  }

  async hardDeleteMany(uploadIds: string[], accountId: string): Promise<void> {
    const uploads = await this.repo.findByIdsAndOwner(uploadIds, accountId);
    if (uploads.length !== uploadIds.length) {
      throw new AppError(403, ErrorCodes.AUTH_FORBIDDEN, 'One or more uploads not found or not owned');
    }
    for (const u of uploads) {
      await this.provider.delete(u.objectKey);
    }
    await this.repo.deleteMany(uploadIds);
  }

  async getMediaUpload(uploadId: string, requesterAccountId: string | null): Promise<{ stream: any; mimeType: string; objectKey: string } | { error: { status: number; code: string; message: string } }> {
    const upload = await this.repo.findById(uploadId);
    if (!upload) {
      return { error: { status: 404, code: ErrorCodes.UPLOAD_NOT_FOUND, message: 'Upload not found' } };
    }

    if (upload.status === 'DELETED') {
      return { error: { status: 404, code: ErrorCodes.UPLOAD_NOT_FOUND, message: 'Upload not found' } };
    }

    await this.repo.updateLastAccessed(upload.id);

    const stream = await this.provider.stream(upload.objectKey);
    return { stream, mimeType: upload.mimeType, objectKey: upload.objectKey };
  }
}
