import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AccountController } from './account.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { validate } from '../../common/middleware/validate.js';
import { changePasswordSchema } from '../../common/validators/auth.validator.js';
import { updateProfileSchema } from '../../common/validators/account.validator.js';
import { authConfig } from '../../config/auth.config.js';

const createRateLimiter = (max: number) =>
  rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  });

export function createAccountRoutes(controller: AccountController): Router {
  const router = Router();

  router.get('/account/me', requireSession, controller.getProfile);
  router.patch('/account/me', requireSession, createRateLimiter(20), validate(updateProfileSchema), controller.updateProfile);
  router.post('/auth/change-password', requireSession, createRateLimiter(10), validate(changePasswordSchema), controller.changePassword);

  return router;
}
