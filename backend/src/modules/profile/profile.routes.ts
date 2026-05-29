import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { ProfileController } from './profile.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { validate } from '../../common/middleware/validate.js';
import { saveDraftSchema } from './dto/save-draft.dto.js';
import { createProfileSchema } from './dto/create-profile.dto.js';
import { browseSchema } from './dto/browse.dto.js';
import { toggleShortlistSchema, profileIdParamSchema } from './dto/toggle-shortlist.dto.js';
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

  const browseLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many browse requests' } },
  });

  const shortlistLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many shortlist requests' } },
  });

  const defaultLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  });

  const showcaseLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  });

  router.get('/profiles/showcase', showcaseLimiter, controller.showcase);

  router.post('/profiles/draft', requireSession, defaultLimiter, validate(saveDraftSchema), controller.saveDraft);
  router.post('/profiles/create', requireSession, validate(createProfileSchema), createLimiter, controller.create);
  router.get('/profiles/my-profiles', requireSession, defaultLimiter, controller.viewMyProfiles);
  router.get('/profiles/draft/:id', requireSession, defaultLimiter, controller.resumeDraft);
  router.delete('/profiles/draft/:id', requireSession, defaultLimiter, controller.deleteDraft);
  router.get('/profiles/browse', requireSession, browseLimiter, validate(browseSchema, 'query'), controller.browse);
  router.get('/profiles/shortlisted', requireSession, defaultLimiter, controller.viewShortlisted);
  router.post('/profiles/:id/shortlist', requireSession, shortlistLimiter, validate(profileIdParamSchema, 'params'), validate(toggleShortlistSchema), controller.toggleShortlist);
  router.get('/profiles/:id', requireSession, defaultLimiter, controller.viewProfile);

  return router;
}
