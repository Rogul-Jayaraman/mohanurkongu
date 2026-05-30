import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { AdminVerificationController } from './admin-verification.controller.js';
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

export function createAdminVerificationRoutes(controller: AdminVerificationController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/verification/queue', controller.getQueue);
  router.get('/verification/stats', controller.getStats);
  router.post('/verification/:id/approve', adminMutationLimiter, controller.approve);
  router.post('/verification/:id/reject', adminMutationLimiter, controller.reject);

  return router;
}
