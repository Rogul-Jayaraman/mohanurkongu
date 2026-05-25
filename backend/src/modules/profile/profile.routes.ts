import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { ProfileController } from './profile.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { validate } from '../../common/middleware/validate.js';
import { saveDraftSchema } from './dto/save-draft.dto.js';
import { createProfileSchema } from './dto/create-profile.dto.js';
import { publishSchema } from './dto/publish.dto.js';
import { authConfig } from '../../config/auth.config.js';

export function createProfileRoutes(controller: ProfileController): Router {
  const router = Router();

  const publishLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many publish requests' } },
  });

  router.post('/profiles/draft', requireSession, validate(saveDraftSchema), controller.saveDraft);
  router.post('/profiles/create', requireSession, validate(createProfileSchema), publishLimiter, controller.create);
  router.get('/profiles/draft/:id', requireSession, controller.resumeDraft);
  router.post('/profiles/publish', requireSession, validate(publishSchema), publishLimiter, controller.publish);
  router.delete('/profiles/draft/:id', requireSession, controller.deleteDraft);
  router.delete('/profiles/:id', requireSession, controller.deleteActive);

  return router;
}
