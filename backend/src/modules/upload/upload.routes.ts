import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import type { UploadController } from './upload.controller.js';
import { requireSession } from '../../common/middleware/requireAuth.js';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const diskStorage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WEBP, HEIC, HEIF'));
    }
  },
});

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
    requireSession,
    uploadLimiter,
    upload.single('file'),
    controller.upload,
  );

  router.delete(
    '/uploads/:id',
    requireSession,
    controller.delete,
  );

  return router;
}
