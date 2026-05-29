import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireSession } from '../../common/middleware/requireAuth.js';
import { generate, searchLocation } from './controllers/horoscope.controller.js';

const router = Router();

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
});

router.post('/generate', requireSession, generateLimiter, generate);
router.get('/location/search', requireSession, searchLimiter, searchLocation);

export default router;
