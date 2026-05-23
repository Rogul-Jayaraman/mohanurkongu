import { VerificationRepository } from './verification.repository.js';
import { authConfig } from '../../config/auth.config.js';
import { hashOTP, generateOTP } from '../../common/utils/otp.js';
import { timingSafeEqual } from '../../common/utils/hash.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import type { VerificationPurpose, VerificationType, VerificationState } from '@prisma/client';

export class VerificationService {
  constructor(private repo: VerificationRepository) {}

  async sendOtp(type: VerificationType, target: string, purpose: VerificationPurpose) {
    const cooldownMs = authConfig.otp.cooldownSeconds * 1000;
    const recent = await this.repo.findRecent(target, purpose, cooldownMs);
    if (recent) {
      throw new AppError(429, ErrorCodes.AUTH_OTP_COOLDOWN, 'AUTH_OTP_COOLDOWN');
    }

    const windowMs = authConfig.otp.resendWindowMinutes * 60 * 1000;
    const resendCount = await this.repo.countResends(target, purpose, windowMs);
    if (resendCount >= authConfig.otp.maxResends) {
      throw new AppError(429, ErrorCodes.RATE_LIMIT_EXCEEDED, 'RATE_LIMIT_EXCEEDED');
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + authConfig.otp.expiryMinutes * 60 * 1000);

    await this.repo.upsert({
      type,
      target,
      otpHash,
      purpose,
      expiresAt,
      maxAttempts: authConfig.otp.maxAttempts,
    });

    return otp;
  }

  async verifyOtp(type: VerificationType, target: string, otp: string, purpose: VerificationPurpose) {
    const record = await this.repo.findLatest(target, purpose);
    if (!record) {
      throw new AppError(400, ErrorCodes.AUTH_OTP_EXPIRED, 'AUTH_OTP_EXPIRED');
    }

    if (record.state === 'EXPIRED') {
      throw new AppError(410, ErrorCodes.AUTH_VERIFICATION_EXPIRED, 'AUTH_VERIFICATION_EXPIRED');
    }

    if (record.state !== 'PENDING') {
      throw new AppError(400, ErrorCodes.AUTH_OTP_ALREADY_USED, 'AUTH_OTP_ALREADY_USED');
    }

    if (record.expiresAt < new Date()) {
      await this.repo.transitionState(record.id, 'EXPIRED');
      throw new AppError(410, ErrorCodes.AUTH_VERIFICATION_EXPIRED, 'AUTH_VERIFICATION_EXPIRED');
    }

    if (record.attempts >= record.maxAttempts) {
      throw new AppError(429, ErrorCodes.AUTH_OTP_MAX_ATTEMPTS, 'AUTH_OTP_MAX_ATTEMPTS');
    }

    const otpHash = hashOTP(otp);
    if (!timingSafeEqual(otpHash, record.otpHash)) {
      await this.repo.incrementAttempts(record.id, record.attempts);
      throw new AppError(400, ErrorCodes.AUTH_OTP_INVALID, 'AUTH_OTP_INVALID');
    }

    await this.repo.transitionState(record.id, 'VERIFIED');
    return record;
  }

  async consumeVerification(id: string) {
    await this.repo.transitionState(id, 'ARCHIVED');
  }

  async cancelVerification(id: string) {
    await this.repo.transitionState(id, 'CANCELLED');
  }
}
