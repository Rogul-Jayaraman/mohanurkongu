import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { MembershipController } from './membership.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';
import { authConfig } from '../../config/auth.config.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';

const adminMutationLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(429, ErrorCodes.RATE_LIMIT_EXCEEDED, ErrorCodes.RATE_LIMIT_EXCEEDED));
  },
});

export function createMembershipRoutes(controller: MembershipController): Router {
  const router = Router();

  // User-facing
  router.get('/membership/plans', requireSession, controller.listPlans);
  router.get('/membership/my-subscription', requireSession, controller.getMySubscription);
  router.get('/membership/capabilities', requireSession, controller.getMyCapabilities);
  router.get('/membership/billing-overview', requireSession, controller.getBillingOverview);

  // Admin
  router.get('/admin/membership/plans', requireSession, requireRole('ADMIN'), controller.adminListPlans);
  router.patch('/admin/membership/plans/:id', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminUpdatePlan);
  router.get('/admin/membership/settings', requireSession, requireRole('ADMIN'), controller.adminGetSetting);
  router.patch('/admin/membership/settings', requireSession, requireRole('ADMIN'), controller.adminUpdateSetting);
  router.post('/admin/membership/subscriptions', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminAssignSubscription);
  router.post('/admin/membership/subscriptions/:accountId/cancel', requireSession, requireRole('ADMIN'), adminMutationLimiter, controller.adminCancelSubscription);
  router.get('/admin/membership/subscriptions', requireSession, requireRole('ADMIN'), controller.adminGetAllSubscriptions);
  router.get('/admin/membership/subscriptions/:accountId/history', requireSession, requireRole('ADMIN'), controller.getSubscriptionHistory);

  return router;
}
