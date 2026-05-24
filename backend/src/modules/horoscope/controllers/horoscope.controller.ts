import type { Request, Response } from 'express';
import { validateBirthInput } from '../schemas/horoscope.schema.js';
import { generateHoroscope } from '../services/calculation.service.js';
import { searchLocations } from '../services/location.service.js';
import { sendSuccess, sendError } from '../../../common/responses/ApiResponse.js';
import { ZodError } from 'zod';

export async function generate(req: Request, res: Response): Promise<void> {
  const parse = validateBirthInput(req.body);
  if (!parse.success) {
    const details = parse.error instanceof ZodError
      ? parse.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }))
      : [{ path: 'body', message: 'Invalid input' }];

    sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
    return;
  }

  try {
    const result = JSON.parse(JSON.stringify(generateHoroscope(parse.data)));
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, 500, 'CALCULATION_ERROR', 'Calculation failed', err.message);
  }
}

export async function searchLocation(req: Request, res: Response): Promise<void> {
  const q = req.query.q as string | undefined;

  if (!q || q.trim().length === 0) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Query parameter q is required', [
      { path: 'q', message: 'Query parameter q is required' },
    ]);
    return;
  }

  if (q.trim().length < 2) {
    sendSuccess(res, []);
    return;
  }

  try {
    const suggestions = await searchLocations(q.trim());
    sendSuccess(res, suggestions);
  } catch (err: any) {
    sendError(res, 502, 'LOCATION_ERROR', 'Location lookup failed', err.message);
  }
}
