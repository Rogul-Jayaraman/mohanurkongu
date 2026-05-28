import { z } from 'zod';

export const toggleShortlistSchema = z.object({
  action: z.enum(['add', 'remove']),
});

export const profileIdParamSchema = z.object({
  id: z.string().uuid(),
});
