import { Router } from 'express';
import { getMyShortlist, handleToggleShortlist } from '../controllers/shortlist';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Apply authentication to all shortlist routes
router.use(authenticate);

/**
 * @route GET /api/shortlist
 * @desc Get all profiles shortlisted by the current user
 */
router.get('/', getMyShortlist);

/**
 * @route POST /api/shortlist/:id
 * @desc Toggle shortlist status for a specific profile
 */
router.post('/:id', handleToggleShortlist);

export default router;
