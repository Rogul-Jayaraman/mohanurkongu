import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AdminAccountController } from './admin-account.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';
import { authConfig } from '../../config/auth.config.js';

const adminMutationLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
});

export function createAdminAccountRoutes(controller: AdminAccountController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/accounts', controller.listAccounts);
  router.get('/accounts/:id', controller.getAccountDetail);
  router.post('/accounts/:id/suspend', adminMutationLimiter, controller.suspendAccount);
  router.post('/accounts/:id/restore', adminMutationLimiter, controller.restoreAccount);

  return router;
}
