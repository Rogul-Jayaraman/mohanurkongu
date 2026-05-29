import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AuthController } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import {
  signupSchema,
  loginSchema,
  resetPasswordSchema,
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
    '/auth/register',
    createRateLimiter(authConfig.rateLimit.signupMax),
    validate(signupSchema),
    controller.register,
  );

  router.post(
    '/auth/login',
    createRateLimiter(20),
    validate(loginSchema),
    controller.login,
  );

  router.post(
    '/auth/refresh',
    createRateLimiter(authConfig.rateLimit.refreshMax),
    controller.refresh,
  );

  router.post('/auth/logout', createRateLimiter(20), controller.logout);
  router.post('/auth/logout-all', requireSession, createRateLimiter(10), controller.logoutAll);

  router.post(
    '/auth/password/reset',
    createRateLimiter(5),
    validate(resetPasswordSchema),
    controller.resetPassword,
  );

  return router;
}
