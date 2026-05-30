import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { AdminAuthController } from './admin-auth.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';
import { validate } from '../../common/middleware/validate.js';
import { loginSchema } from '../../common/validators/auth.validator.js';
import { createRateLimiter } from '../shared/rateLimiter.js';

export function createAdminAuthRoutes(controller: AdminAuthController): Router {
  const router = Router();

  router.post(
    '/auth/login',
    createRateLimiter(10),
    validate(loginSchema),
    controller.login,
  );

  router.post('/auth/refresh', createRateLimiter(10), controller.refresh);
  router.post('/auth/logout', createRateLimiter(20), controller.logout);

  router.get(
    '/account/me',
    requireSession,
    requireRole('ADMIN'),
    controller.getProfile,
  );

  return router;
}
