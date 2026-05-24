import { Router } from 'express';
import { generate, searchLocation } from './controllers/horoscope.controller.js';

const router = Router();

router.post('/generate', generate);
router.get('/location/search', searchLocation);

export default router;
