import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AdminAuthController } from './admin-auth.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';
import { validate } from '../../common/middleware/validate.js';
import { loginSchema } from '../../common/validators/auth.validator.js';
import { authConfig } from '../../config/auth.config.js';

const createRateLimiter = (max: number) =>
  rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  });

export function createAdminAuthRoutes(controller: AdminAuthController): Router {
  const router = Router();

  router.post(
    '/auth/login',
    createRateLimiter(10),
    validate(loginSchema),
    controller.login,
  );

  router.post(
    '/auth/refresh',
    createRateLimiter(authConfig.rateLimit.refreshMax),
    controller.refresh,
  );

  router.post(
    '/auth/logout',
    createRateLimiter(20),
    controller.logout,
  );

  router.get(
    '/account/me',
    requireSession,
    requireRole('ADMIN'),
    controller.getProfile,
  );

  return router;
}
