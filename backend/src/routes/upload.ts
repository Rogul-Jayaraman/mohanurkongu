import { Router } from 'express';
import { getCloudinarySignature } from '../controllers/uploadController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Get signed signature for direct frontend uploads
router.get('/signature', authenticate, (req, res, next) => getCloudinarySignature(req, res).catch(next));

export default router;
