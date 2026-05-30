import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/ErrorCodes.js';
import { authConfig } from '../../config/auth.config.js';

export function createRateLimiter(max: number) {
  return rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(new AppError(429, ErrorCodes.RATE_LIMIT_EXCEEDED, ErrorCodes.RATE_LIMIT_EXCEEDED));
    },
  });
}
