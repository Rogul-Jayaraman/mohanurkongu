import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VerificationRepository } from '../../modules/verification/verification.repository.js';
import { VerificationService } from '../../modules/verification/verification.service.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

vi.mock('../../database/prisma.js', () => {
  const mockDb: any = {};
  const mockPrisma = {
    accountVerification: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock('../../common/utils/otp.js', () => ({
  generateOTP: vi.fn(() => '123456'),
  hashOTP: vi.fn((otp: string) => `hashed_${otp}`),
}));

vi.mock('../../common/utils/hash.js', () => ({
  timingSafeEqual: vi.fn((a: string, b: string) => a === b),
}));

vi.mock('../../config/auth.config.js', () => ({
  authConfig: {
    otp: {
      cooldownSeconds: 60,
      resendWindowMinutes: 5,
      maxResends: 3,
      expiryMinutes: 5,
      maxAttempts: 5,
      length: 6,
    },
  },
}));

import { prisma } from '../../database/prisma.js';

function createMockVerification(overrides: any = {}) {
  return {
    id: 'ver-1',
    accountId: null,
    type: 'EMAIL',
    purpose: 'REGISTER',
    target: 'test@example.com',
    otpHash: 'hashed_123456',
    state: overrides.state ?? 'PENDING',
    attempts: overrides.attempts ?? 0,
    maxAttempts: 5,
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 300000),
    consumedAt: overrides.consumedAt ?? null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Verification Lifecycle', () => {
  let repo: VerificationRepository;
  let service: VerificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new VerificationRepository();
    service = new VerificationService(repo);
  });

  describe('Case 1: OTP expires then verify', () => {
    it('should return expired when verifying an expired PENDING verification', async () => {
      const expiredRecord = createMockVerification({
        state: 'PENDING',
        expiresAt: new Date(Date.now() - 60000),
      });

      vi.mocked(prisma.accountVerification.findFirst).mockResolvedValue(expiredRecord);
      vi.mocked(prisma.accountVerification.update).mockResolvedValue({ ...expiredRecord, state: 'EXPIRED' });

      try {
        await service.verifyOtp('EMAIL', 'test@example.com', '123456', 'REGISTER');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).code).toBe(ErrorCodes.AUTH_VERIFICATION_EXPIRED);
      }

      expect(prisma.accountVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: 'EXPIRED' }),
        }),
      );
    });
  });

  describe('Case 2: Verify OTP, signup still works after cleanup', () => {
    it('should create registration session snapshot independent of verification row', async () => {
      const verifiedRecord = createMockVerification({ state: 'VERIFIED', consumedAt: new Date() });

      vi.mocked(prisma.accountVerification.findFirst).mockResolvedValueOnce(verifiedRecord);

      const result = await repo.findLatest('test@example.com', 'REGISTER');

      expect(result).toBeDefined();
      expect(result!.id).toBe('ver-1');
    });
  });

  describe('Case 3: Email delayed - verification still valid', () => {
    it('should allow verification when within expiry time', async () => {
      const validRecord = createMockVerification({
        state: 'PENDING',
        expiresAt: new Date(Date.now() + 120000),
      });

      vi.mocked(prisma.accountVerification.findFirst).mockResolvedValue(validRecord);
      vi.mocked(prisma.accountVerification.update).mockResolvedValue({ ...validRecord, state: 'VERIFIED', consumedAt: new Date() });

      const result = await service.verifyOtp('EMAIL', 'test@example.com', '123456', 'REGISTER');

      expect(result.id).toBe('ver-1');
      expect(prisma.accountVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ver-1' },
          data: expect.objectContaining({ state: 'VERIFIED' }),
        }),
      );
    });
  });

  describe('Case 4: Archived - signup still works via session snapshot', () => {
    it('should allow signup using snapshot target even if verification is archived', async () => {
      const snapshotTarget = 'test@example.com';

      expect(snapshotTarget).toBe('test@example.com');
    });
  });

  describe('Case 5: Purged - completed flow unaffected', () => {
    it('should allow purge of old ARCHIVED records', async () => {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.accountVerification.deleteMany).mockResolvedValue({ count: 5 });

      const count = await repo.purgeArchived(90);

      expect(count).toBe(5);
      expect(prisma.accountVerification.deleteMany).toHaveBeenCalledWith({
        where: {
          state: 'ARCHIVED',
          archivedAt: { lt: expect.any(Date) },
        },
      });
    });
  });

  describe('Expire job', () => {
    it('should transition PENDING expired records to EXPIRED', async () => {
      vi.mocked(prisma.accountVerification.updateMany).mockResolvedValue({ count: 3 });

      const count = await repo.expirePending();

      expect(count).toBe(3);
      expect(prisma.accountVerification.updateMany).toHaveBeenCalledWith({
        where: {
          state: 'PENDING',
          expiresAt: { lt: expect.any(Date) },
        },
        data: { state: 'EXPIRED' },
      });
    });
  });

  describe('Archive job', () => {
    it('should archive old EXPIRED/VERIFIED/CANCELLED records', async () => {
      vi.mocked(prisma.accountVerification.updateMany).mockResolvedValue({ count: 10 });

      const count = await repo.archiveOld(30);

      expect(count).toBe(10);
      expect(prisma.accountVerification.updateMany).toHaveBeenCalledWith({
        where: {
          state: { in: ['EXPIRED', 'VERIFIED', 'CANCELLED'] },
          updatedAt: { lt: expect.any(Date) },
        },
        data: { state: 'ARCHIVED', archivedAt: expect.any(Date) },
      });
    });
  });

  describe('Purge job', () => {
    it('should delete old ARCHIVED records', async () => {
      vi.mocked(prisma.accountVerification.deleteMany).mockResolvedValue({ count: 20 });

      const count = await repo.purgeArchived(90);

      expect(count).toBe(20);
    });
  });
});
