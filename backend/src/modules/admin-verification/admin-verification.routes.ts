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

  router.use(requireSession);

  router.get('/verification/queue', requireRole('ADMIN'), controller.getQueue);
  router.get('/verification/stats', requireRole('ADMIN'), controller.getStats);
  router.post('/verification/:id/approve', requireRole('ADMIN'), adminMutationLimiter, controller.approve);
  router.post('/verification/:id/reject', requireRole('ADMIN'), adminMutationLimiter, controller.reject);
  router.post('/verification/:id/claim', requireRole('ADMIN'), adminMutationLimiter, controller.claim);
  router.post('/verification/:id/unclaim', requireRole('ADMIN'), adminMutationLimiter, controller.unclaim);

  return router;
}
