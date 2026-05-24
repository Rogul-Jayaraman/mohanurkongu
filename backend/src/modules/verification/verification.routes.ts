import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { VerificationController } from './verification.controller.js';
import { validate } from '../../common/middleware/validate.js';
import {
  sendRegistrationOtpSchema,
  verifyRegistrationOtpSchema,
  forgotPasswordOtpSchema,
  verifyResetOtpSchema,
} from '../../common/validators/auth.validator.js';
import { authConfig } from '../../config/auth.config.js';

const createRateLimiter = (max: number) =>
  rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  });

export function createVerificationRoutes(controller: VerificationController): Router {
  const router = Router();

  router.post(
    '/auth/registration/otp',
    createRateLimiter(authConfig.rateLimit.otpMax),
    validate(sendRegistrationOtpSchema),
    controller.sendRegistrationOtp,
  );

  router.post(
    '/auth/registration/otp/verify',
    createRateLimiter(authConfig.rateLimit.otpVerifyMax),
    validate(verifyRegistrationOtpSchema),
    controller.verifyRegistrationOtp,
  );

  router.post(
    '/auth/password/otp',
    createRateLimiter(authConfig.rateLimit.otpMax),
    validate(forgotPasswordOtpSchema),
    controller.sendPasswordResetOtp,
  );

  router.post(
    '/auth/password/otp/verify',
    createRateLimiter(authConfig.rateLimit.otpVerifyMax),
    validate(verifyResetOtpSchema),
    controller.verifyPasswordResetOtp,
  );

  return router;
}
