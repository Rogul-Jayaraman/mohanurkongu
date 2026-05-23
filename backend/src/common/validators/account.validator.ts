import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstNameEn: z.string().min(1).max(100).optional(),
  lastNameEn: z.string().min(1).max(100).optional(),
  firstNameTa: z.string().min(1).max(100).optional(),
  lastNameTa: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+[\d]{7,15}$/).optional(),
});
