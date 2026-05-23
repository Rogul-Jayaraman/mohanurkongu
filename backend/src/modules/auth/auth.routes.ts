import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AuthController } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { requireAuth } from '../../common/middleware/requireAuth.js';
import {
  sendRegistrationOtpSchema,
  verifyRegistrationOtpSchema,
  signupSchema,
  loginSchema,
  forgotPasswordOtpSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
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

export function createAuthRoutes(controller: AuthController): Router {
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
    '/auth/signup',
    createRateLimiter(authConfig.rateLimit.signupMax),
    validate(signupSchema),
    controller.signup,
  );

  router.post(
    '/auth/login',
    createRateLimiter(20),
    validate(loginSchema),
    controller.login,
  );

  router.post('/auth/refresh', controller.refresh);
  router.post('/auth/logout', controller.logout);
  router.post('/auth/logout-all', requireAuth, controller.logoutAll);

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

  router.post(
    '/auth/password/reset',
    validate(resetPasswordSchema),
    controller.resetPassword,
  );

  router.get('/auth/me', requireAuth, controller.getProfile);

  router.post(
    '/auth/change-password',
    requireAuth,
    validate(changePasswordSchema),
    controller.changePassword,
  );

  return router;
}
