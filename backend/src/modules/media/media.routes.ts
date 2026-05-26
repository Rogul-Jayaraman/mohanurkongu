import { Router } from 'express';
import type { MediaController } from './media.controller.js';
import { optionalAuth } from '../../common/middleware/requireAuth.js';

export function createMediaRoutes(controller: MediaController): Router {
  const router = Router();

  router.get(
    '/media/:uploadId',
    optionalAuth,
    controller.stream,
  );

  return router;
}
