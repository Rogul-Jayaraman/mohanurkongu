import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { sendError } from '../responses/ApiResponse.js';
import { translate } from '../utils/translation.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const lang = res.locals?.lang || 'en';

  if (err instanceof AppError) {
    const message = err.message === err.code ? translate(err.code, lang) : err.message;
    sendError(res, err.statusCode, err.code, message, err.details);
    return;
  }

  logger.error({ err, reqId: req.id }, 'Unhandled error');
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, translate(ErrorCodes.INTERNAL_ERROR, lang));
}
