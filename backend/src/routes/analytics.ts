import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

// Only Admins can access analytics
router.use(authenticate as any);
router.use(authorizeAdmin as any);

router.get('/', analyticsController.getDashboardAnalytics);
router.get('/stats', analyticsController.getBasicStats);

export default router;
