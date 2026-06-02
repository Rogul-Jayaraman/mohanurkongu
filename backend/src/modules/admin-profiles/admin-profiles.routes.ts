import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { AdminProfilesController } from './admin-profiles.controller.js';
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

export function createAdminProfilesRoutes(controller: AdminProfilesController): Router {
  const router = Router();

  router.use(requireSession);

  router.get('/profiles', requireRole('ADMIN'), controller.list);
  router.get('/profiles/:id', requireRole('ADMIN'), controller.detail);
  router.get('/profiles/:id/audit', requireRole('ADMIN'), controller.audit);
  router.put('/profiles/:id', requireRole('ADMIN'), adminMutationLimiter, controller.update);
  router.post('/profiles/:id/archive', requireRole('ADMIN'), adminMutationLimiter, controller.archive);
  router.post('/profiles/:id/restore', requireRole('ADMIN'), adminMutationLimiter, controller.restore);
  router.post('/profiles/:id/delete', requireRole('ADMIN'), adminMutationLimiter, controller.deleteProfile);

  return router;
}
