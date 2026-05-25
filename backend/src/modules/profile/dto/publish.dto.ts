import { z } from 'zod';

export const publishSchema = z.object({
  draftId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
});
