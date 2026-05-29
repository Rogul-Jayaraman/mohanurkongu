import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import type { UploadController } from './upload.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';

const diskStorage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({ storage: diskStorage, limits: { fileSize: 10 * 1024 * 1024 } });

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many upload requests' } },
});

export function createUploadRoutes(controller: UploadController): Router {
  const router = Router();

  router.post(
    '/uploads',
    (req, _res, next) => { console.log('[upload.routes] requireSession start'); next(); },
    requireSession,
    (req, _res, next) => { console.log('[upload.routes] requireSession done, uploadLimiter start'); next(); },
    uploadLimiter,
    (req, _res, next) => { console.log('[upload.routes] uploadLimiter done, multer start'); next(); },
    upload.single('file'),
    (req, _res, next) => { console.log('[upload.routes] multer done, controller start'); next(); },
    controller.upload,
  );

  router.delete(
    '/uploads/:id',
    requireSession,
    controller.delete,
  );

  return router;
}
