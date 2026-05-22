/**
 * Centralized validation schemas for authentication
 * Using Zod for runtime schema validation
 */

import { z } from 'zod';

/**
 * Signup Schema
 * Validates user registration data
 */
export const signupSchema = z.object({
  firstNameEn: z
    .string()
    .min(1, 'First name (English) is required')
    .max(50, 'First name (English) must be less than 50 characters'),
  lastNameEn: z
    .string()
    .min(1, 'Last name (English) is required')
    .max(50, 'Last name (English) must be less than 50 characters'),
  firstNameTa: z
    .string()
    .min(1, 'First name (Tamil) is required')
    .max(50, 'First name (Tamil) must be less than 50 characters'),
  lastNameTa: z
    .string()
    .min(1, 'Last name (Tamil) is required')
    .max(50, 'Last name (Tamil) must be less than 50 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(25, 'Phone number must be at most 25 characters')
    .regex(/^\+[\d\s-]+$/, 'Phone number must be in format: +CountryCode - Number')
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export enum AccountRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * Login Schema
 * Validates user login data - email or phone
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  requiredRole: z.nativeEnum(AccountRole).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Send OTP Schema
 * Validates OTP sending request
 */
export const sendOtpSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

/**
 * Verify OTP Schema
 * Validates OTP verification for existing user flows
 */
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/**
 * Reset Password Schema
 * Validates password reset data
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Forgot Password Schema
 * Validates forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;


