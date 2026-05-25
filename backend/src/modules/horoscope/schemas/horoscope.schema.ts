import { z } from 'zod';

export const BirthInputSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .refine((val) => {
      const year = parseInt(val.slice(0, 4), 10);
      return year >= 1900 && year <= new Date().getFullYear();
    }, 'Birth year must be between 1900 and current year'),
  timeOfBirth: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS'),
  location: z.object({
    displayName: z.string().min(1, 'Location display name is required'),
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  }),
});

export type ValidatedInput = z.infer<typeof BirthInputSchema>;

export function validateBirthInput(input: unknown) {
  return BirthInputSchema.safeParse(input);
}
