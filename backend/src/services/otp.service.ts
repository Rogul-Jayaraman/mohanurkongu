import crypto from 'crypto';
import prisma from '../config/prisma';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 3;
const MAX_ATTEMPTS = 5;

export const generateOtp = (): string => {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

export const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const verifyOtpHash = (otp: string, hash: string): boolean => {
  const computedHash = hashOtp(otp);
  if (computedHash.length !== hash.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  } catch {
    return false;
  }
};

export const getExpiryDate = (minutes: number = OTP_EXPIRY_MINUTES): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const cleanupExpiredPhoneVerifications = async (): Promise<number> => {
  const result = await prisma.verification.deleteMany({
    where: {
      type: 'PHONE',
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
};

export { OTP_EXPIRY_MINUTES, MAX_ATTEMPTS };
