import { describe, it, expect } from 'vitest';
import { generateOTP, hashOTP } from '../../common/utils/otp.js';
import { timingSafeEqual } from '../../common/utils/hash.js';

describe('OTP Utils', () => {
  it('should generate a 6-digit OTP', () => {
    const otp = generateOTP(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should hash OTP deterministically', () => {
    const otp = '123456';
    const hash1 = hashOTP(otp);
    const hash2 = hashOTP(otp);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should verify via timingSafeEqual', () => {
    const otp = '654321';
    const hash = hashOTP(otp);
    const valid = timingSafeEqual(hash, hashOTP(otp));
    expect(valid).toBe(true);
  });

  it('should reject wrong OTP via timingSafeEqual', () => {
    const hash = hashOTP('123456');
    const valid = timingSafeEqual(hash, hashOTP('654321'));
    expect(valid).toBe(false);
  });
});
