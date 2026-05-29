import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { MembershipController } from './membership.controller.js';
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

export function createMembershipRoutes(controller: MembershipController): Router {
  const router = Router();

  // User-facing
  router.get('/membership/plans', requireSession, controller.listPlans);
  router.get('/membership/my-subscription', requireSession, controller.getMySubscription);
  router.get('/membership/capabilities', requireSession, controller.getMyCapabilities);

  // Admin
  router.get('/admin/membership/plans', requireSession, requireRole('ADMIN'), controller.adminListPlans);
  router.patch('/admin/membership/plans/:id', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminUpdatePlan);
  router.get('/admin/membership/settings', requireSession, requireRole('ADMIN'), controller.adminGetSetting);
  router.patch('/admin/membership/settings', requireSession, requireRole('ADMIN'), controller.adminUpdateSetting);
  router.post('/admin/membership/subscriptions', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminAssignSubscription);
  router.get('/admin/membership/subscriptions', requireSession, requireRole('ADMIN'), controller.adminGetAllSubscriptions);
  router.get('/admin/membership/subscriptions/:accountId/history', requireSession, requireRole('ADMIN'), controller.getSubscriptionHistory);

  return router;
}
