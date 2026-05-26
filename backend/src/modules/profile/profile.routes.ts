import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { ProfileController } from './profile.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { requireRole } from '../../common/guards/role.guard.js';
import { validate } from '../../common/middleware/validate.js';
import { saveDraftSchema } from './dto/save-draft.dto.js';
import { createProfileSchema } from './dto/create-profile.dto.js';
import { rejectProfileSchema } from './dto/reject-profile.dto.js';
import { authConfig } from '../../config/auth.config.js';

export function createProfileRoutes(controller: ProfileController): Router {
  const router = Router();

  const createLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many create requests' } },
  });

  router.post('/profiles/draft', requireSession, validate(saveDraftSchema), controller.saveDraft);
  router.post('/profiles/create', requireSession, validate(createProfileSchema), createLimiter, controller.create);
  router.get('/profiles/my-profiles', requireSession, controller.viewMyProfiles);
  router.get('/profiles/draft/:id', requireSession, controller.resumeDraft);
  router.delete('/profiles/draft/:id', requireSession, controller.deleteDraft);
  router.get('/profiles/:id', requireSession, controller.viewProfile);

  router.post('/admin/profiles/:id/approve', requireSession, requireRole('ADMIN'), controller.approve);
  router.post('/admin/profiles/:id/reject', requireSession, requireRole('ADMIN'), validate(rejectProfileSchema), controller.reject);

  return router;
}
