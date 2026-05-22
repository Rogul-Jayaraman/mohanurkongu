import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import * as settingsController from '../controllers/settingsController';

const router = Router();

// TODO: Re-implement premium-price and plan-history routes with new plan system

/**
 * POST /api/settings/change-password
 * Securely rotates the authenticated user's/admin's password.
 */
router.post('/change-password', authenticate, settingsController.changePassword);

export default router;
