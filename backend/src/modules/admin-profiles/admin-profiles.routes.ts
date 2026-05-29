import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AdminProfilesController } from './admin-profiles.controller.js';
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

export function createAdminProfilesRoutes(controller: AdminProfilesController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/profiles', controller.list);
  router.get('/profiles/:id', controller.detail);
  router.post('/profiles/:id/archive', adminMutationLimiter, controller.archive);
  router.post('/profiles/:id/restore', adminMutationLimiter, controller.restore);
  router.post('/profiles/:id/delete', adminMutationLimiter, controller.deleteProfile);

  return router;
}
