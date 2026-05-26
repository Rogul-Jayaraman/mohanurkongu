import { z } from 'zod';

export const rejectProfileSchema = z.object({
  reasonEn: z.string().min(1).max(500),
  reasonTa: z.string().max(500).optional(),
});
