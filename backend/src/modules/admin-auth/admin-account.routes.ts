import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { AdminAccountController } from './admin-account.controller.js';
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

export function createAdminAccountRoutes(controller: AdminAccountController): Router {
  const router = Router();

  router.use(requireSession, requireRole('ADMIN'));

  router.get('/accounts', controller.listAccounts);
  router.get('/accounts/:id', controller.getAccountDetail);
  router.post('/accounts/:id/suspend', adminMutationLimiter, controller.suspendAccount);
  router.post('/accounts/:id/restore', adminMutationLimiter, controller.restoreAccount);

  return router;
}
