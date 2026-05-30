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

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/profiles', controller.list);
  router.get('/profiles/:id', controller.detail);
  router.put('/profiles/:id', adminMutationLimiter, controller.update);
  router.post('/profiles/:id/archive', adminMutationLimiter, controller.archive);
  router.post('/profiles/:id/restore', adminMutationLimiter, controller.restore);
  router.post('/profiles/:id/delete', adminMutationLimiter, controller.deleteProfile);

  return router;
}
