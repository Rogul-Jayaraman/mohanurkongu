import { Router } from 'express';
import type { AdminDashboardController } from './admin-dashboard.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';

export function createAdminDashboardRoutes(controller: AdminDashboardController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/dashboard/stats', controller.getStats);

  return router;
}
