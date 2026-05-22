import { Router } from 'express';
import { getFeaturedProfiles } from '../controllers/public';

const router = Router();

router.get('/featured-profiles', (req, res, next) => getFeaturedProfiles(req, res).catch(next));

export default router;
