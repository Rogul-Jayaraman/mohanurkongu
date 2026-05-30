import { z } from 'zod';

export const publicPackagesQuerySchema = z.object({
  language: z.enum(['EN', 'TA']).default('EN'),
});

export const publicFacilitiesQuerySchema = z.object({
  language: z.enum(['EN', 'TA']).default('EN'),
});

export const publicAddonsQuerySchema = z.object({
  language: z.enum(['EN', 'TA']).default('EN'),
});
