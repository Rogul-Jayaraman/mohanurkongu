import { Request, Response } from 'express';
import { createHash } from 'crypto';
import prisma from '../../../config/prisma';
import { validateBirthInput } from '../schemas/horoscope.schema';
import { generateHoroscope } from '../services/calculation.service';
import { searchLocations } from '../services/location.service';
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

    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  try {
    const { draftId, ...birthData } = parse.data as any;
    const inputHash = createHash('sha256').update(JSON.stringify(birthData)).digest('hex');

    if (draftId) {
      const draft = await prisma.profileDraft.findUnique({ where: { draftId } });
      if (draft && draft.inputHash === inputHash && draft.horoscopeJson) {
        res.json({ cached: true, ...(draft.horoscopeJson as any) });
        return;
      }
    }

    const result = JSON.parse(JSON.stringify(generateHoroscope(birthData)));

    if (draftId) {
      await prisma.profileDraft.upsert({
        where: { draftId },
        update: {
          horoscopeJson: result,
          horoscopeGenerated: true,
          horoscopeGeneratedAt: new Date(),
          inputHash,
        },
        create: {
          draftId,
          userId: (req as any).user?.userId || '',
          currentStep: 7,
          horoscopeJson: result,
          horoscopeGenerated: true,
          horoscopeGeneratedAt: new Date(),
          inputHash,
          lastSavedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error('[HoroscopeController] Calculation failed:', err.message);
    res.status(500).json({
      error: 'Calculation failed',
      code: 'CALCULATION_ERROR',
      details: err.message,
    });
  }
}

export async function searchLocation(req: Request, res: Response): Promise<void> {
  const q = req.query.q as string | undefined;

  if (!q || q.trim().length === 0) {
    res.status(400).json({
      error: 'Missing query parameter',
      code: 'VALIDATION_ERROR',
      details: [{ path: 'q', message: 'Query parameter q is required' }],
    });
    return;
  }

  if (q.trim().length < 2) {
    res.json([]);
    return;
  }

  try {
    const suggestions = await searchLocations(q.trim());
    res.json(suggestions);
  } catch (err: any) {
    console.error('[HoroscopeController] Location lookup failed:', err.message);
    res.status(502).json({
      error: 'Location lookup failed',
      code: 'LOCATION_ERROR',
      details: err.message,
    });
  }
}
