import { Router } from 'express';
import type { AuthController } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import {
  signupSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../../common/validators/auth.validator.js';
import { createRateLimiter } from '../shared/rateLimiter.js';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  // Public routes (no auth required)
  router.post('/auth/register', createRateLimiter(5), validate(signupSchema), controller.register);
  router.post('/auth/login', createRateLimiter(20), validate(loginSchema), controller.login);
  router.post('/auth/refresh', createRateLimiter(10), controller.refresh);
  router.post('/auth/logout', createRateLimiter(20), controller.logout);

  router.post('/auth/change-password', requireSession, createRateLimiter(5), validate(changePasswordSchema), controller.changePassword);
  router.post('/auth/logout-all', requireSession, createRateLimiter(10), controller.logoutAll);

  router.post('/auth/password/reset', createRateLimiter(5), validate(resetPasswordSchema), controller.resetPassword);

  return router;
}
