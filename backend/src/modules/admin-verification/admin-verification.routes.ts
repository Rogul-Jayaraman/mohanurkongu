import { Router } from 'express';
import type { AdminVerificationController } from './admin-verification.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';

export function createAdminVerificationRoutes(controller: AdminVerificationController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/verification/queue', controller.getQueue);
  router.get('/verification/stats', controller.getStats);
  router.post('/verification/:id/approve', controller.approve);
  router.post('/verification/:id/reject', controller.reject);

  return router;
}
