import { describe, it, expect } from 'vitest';
import {
  sendRegistrationOtpSchema,
  verifyRegistrationOtpSchema,
  loginSchema,
  signupSchema,
  forgotPasswordOtpSchema,
  changePasswordSchema,
} from '../../common/validators/auth.validator.js';

describe('Auth Validators', () => {
  describe('sendRegistrationOtpSchema', () => {
    it('should accept valid email', () => {
      const result = sendRegistrationOtpSchema.parse({ email: 'test@example.com' });
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      expect(() => sendRegistrationOtpSchema.parse({ email: 'invalid' })).toThrow();
    });
  });

  describe('verifyRegistrationOtpSchema', () => {
    it('should accept valid email and otp', () => {
      const result = verifyRegistrationOtpSchema.parse({ email: 'test@example.com', otp: '123456' });
      expect(result.otp).toBe('123456');
    });

    it('should reject short otp', () => {
      expect(() => verifyRegistrationOtpSchema.parse({ email: 'test@example.com', otp: '12345' })).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should accept identifier and password', () => {
      const result = loginSchema.parse({ identifier: 'test@example.com', password: 'mypassword' });
      expect(result.identifier).toBe('test@example.com');
    });

    it('should accept optional portal', () => {
      const result = loginSchema.parse({ identifier: 'test@example.com', password: 'mypassword', portal: 'ADMIN' });
      expect(result.portal).toBe('ADMIN');
    });

    it('should reject invalid portal', () => {
      expect(() => loginSchema.parse({ identifier: 'test@example.com', password: 'mypassword', portal: 'INVALID' })).toThrow();
    });
  });

  describe('signupSchema', () => {
    const validData = {
      verificationToken: 'token-123',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      firstNameTa: 'ஜான்',
      lastNameTa: 'டோ',
      email: 'test@example.com',
      password: 'StrongP@ss1',
    };

    it('should accept valid signup data', () => {
      const result = signupSchema.parse(validData);
      expect(result.firstNameEn).toBe('John');
    });

    it('should reject weak password', () => {
      expect(() => signupSchema.parse({ ...validData, password: 'weak' })).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => signupSchema.parse({ verificationToken: 'token-123', email: 'test@example.com', password: 'StrongP@ss1' })).toThrow();
    });
  });

  describe('forgotPasswordOtpSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordOtpSchema.parse({ email: 'test@example.com' });
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept valid password change', () => {
      const result = changePasswordSchema.parse({ currentPassword: 'old', newPassword: 'NewStr0ng!' });
      expect(result.currentPassword).toBe('old');
    });

    it('should reject weak new password', () => {
      expect(() => changePasswordSchema.parse({ currentPassword: 'old', newPassword: 'weak' })).toThrow();
    });
  });
});
