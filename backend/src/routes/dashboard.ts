import { Router } from 'express';
import { getOverview } from '../controllers/dashboard';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * Dashboard Routes
 * All endpoints are protected by authentication.
 */

// GET /api/dashboard/overview
router.get('/overview', authenticate, (req, res, next) => getOverview(req as any, res).catch(next));

export default router;
