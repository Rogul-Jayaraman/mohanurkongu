import { Router } from 'express';
import type { AdminProfilesController } from './admin-profiles.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';

export function createAdminProfilesRoutes(controller: AdminProfilesController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/profiles', controller.list);
  router.get('/profiles/:id', controller.detail);
  router.post('/profiles/:id/archive', controller.archive);
  router.post('/profiles/:id/restore', controller.restore);
  router.post('/profiles/:id/delete', controller.deleteProfile);

  return router;
}
