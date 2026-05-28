import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { translate } from '../utils/translation.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Express 5+ makes req.query a read-only getter
      if (source === 'query' || source === 'params') {
        Object.defineProperty(req, source, { value: data, writable: true, configurable: true });
      } else {
        req[source] = data;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const lang = req.res?.locals?.lang || 'en';
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: translate(e.message, lang, 'validation'),
        }));
        next(new AppError(400, ErrorCodes.VALIDATION_ERROR, translate(ErrorCodes.VALIDATION_ERROR, lang), details));
      } else {
        next(err);
      }
    }
  };
}
