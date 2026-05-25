import crypto from 'node:crypto';
import { authConfig } from '../../config/auth.config.js';

export function generateOTP(length: number = authConfig.otp.length): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  const num = crypto.randomInt(min, max);
  return num.toString().padStart(length, '0');
}

export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}
