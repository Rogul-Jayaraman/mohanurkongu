import type { Request, Response, NextFunction } from 'express';
import { validateBirthInput } from '../schemas/horoscope.schema.js';
import { generateHoroscope } from '../services/calculation.service.js';
import { searchLocations } from '../services/location.service.js';
import { sendSuccess } from '../../../common/responses/ApiResponse.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import { ZodError } from 'zod';

export async function generate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parse = validateBirthInput(req.body);
    if (!parse.success) {
      const details = parse.error instanceof ZodError
        ? parse.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        : [{ path: 'body', message: 'Invalid input' }];
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details);
    }

    const result = generateHoroscope(parse.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function searchLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query.q as string | undefined;

    if (!q || q.trim().length === 0) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Query parameter q is required');
    }

    if (q.trim().length < 2) {
      sendSuccess(res, []);
      return;
    }

    const suggestions = await searchLocations(q.trim());
    sendSuccess(res, suggestions);
  } catch (err) {
    next(err);
  }
}
