import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AdminVerificationController } from './admin-verification.controller.js';
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

export function createAdminVerificationRoutes(controller: AdminVerificationController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/verification/queue', controller.getQueue);
  router.get('/verification/stats', controller.getStats);
  router.post('/verification/:id/approve', adminMutationLimiter, controller.approve);
  router.post('/verification/:id/reject', adminMutationLimiter, controller.reject);

  return router;
}
