import { Router } from 'express';
import type { AnalyticsController } from './analytics.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';

export function createAnalyticsRoutes(controller: AnalyticsController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/analytics/matrimony', controller.getMatrimony);
  router.get('/analytics/mandapam', controller.getMandapam);
  router.get('/analytics/membership', controller.getMembership);
  router.get('/analytics/operations', controller.getOperations);

  return router;
}
