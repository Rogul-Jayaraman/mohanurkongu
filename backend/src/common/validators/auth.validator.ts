import { z } from 'zod';

const emailField = z.string().email('INVALID_EMAIL').transform((v) => v.toLowerCase().trim());
const phoneField = z.string().regex(/^\+[\d]{7,15}$/, 'INVALID_PHONE').optional();
const passwordField = z
  .string()
  .min(8, 'PASSWORD_TOO_SHORT')
  .regex(/[A-Z]/, 'PASSWORD_WEAK')
  .regex(/[0-9]/, 'PASSWORD_WEAK')
  .regex(/[^a-zA-Z0-9]/, 'PASSWORD_WEAK');

export const sendRegistrationOtpSchema = z.object({
  email: emailField,
});

export const verifyRegistrationOtpSchema = z.object({
  email: emailField,
  otp: z.string().length(6, 'INVALID_OTP'),
});

export const signupSchema = z.object({
  verificationToken: z.string().min(1, 'REQUIRED'),
  firstNameEn: z.string().min(1, 'FIRST_NAME_REQUIRED').max(100),
  lastNameEn: z.string().min(1, 'LAST_NAME_REQUIRED').max(100),
  firstNameTa: z.string().min(1, 'FIRST_NAME_REQUIRED').max(100),
  lastNameTa: z.string().min(1, 'LAST_NAME_REQUIRED').max(100),
  email: emailField,
  phone: phoneField,
  password: passwordField,
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'REQUIRED'),
  password: z.string().min(1, 'REQUIRED'),
  portal: z.enum(['USER', 'ADMIN']).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'REQUIRED'),
});

export const forgotPasswordOtpSchema = z.object({
  email: emailField,
});

export const verifyResetOtpSchema = z.object({
  email: emailField,
  otp: z.string().length(6, 'INVALID_OTP'),
});

export const resetPasswordSchema = z.object({
  email: emailField,
  resetToken: z.string().min(1, 'REQUIRED'),
  password: passwordField,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'REQUIRED'),
  newPassword: passwordField,
});
