import { z } from 'zod';

export const browseSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  q: z.string().max(100).optional(),
  sort: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),

  // Location
  currentDistrict: z.string().optional(),
  currentTaluk: z.string().optional(),
  nativeDistrict: z.string().optional(),

  // Physical
  ageMin: z.coerce.number().int().min(18).max(100).optional(),
  ageMax: z.coerce.number().int().min(18).max(100).optional(),
  heightMin: z.coerce.number().optional(),
  heightMax: z.coerce.number().optional(),
  minWeight: z.coerce.number().int().min(0).optional(),
  maxWeight: z.coerce.number().int().min(0).optional(),
  maritalStatus: z.string().optional(),
  complexion: z.string().optional(),
  diet: z.string().optional(),

  // Community
  caste: z.string().optional(),
  kulam: z.string().optional(),
  kulamAvoid: z.array(z.string()).optional(),
  kuladeivam: z.string().optional(),

  // Astrology
  rasi: z.string().optional(),
  nakshatra: z.string().optional(),
  laganam: z.string().optional(),


  // Professional
  education: z.string().optional(),
  jobSector: z.string().optional(),
  jobTitle: z.string().optional(),
  jobLocation: z.string().optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),

  // Assets
  residence: z.string().optional(),
});
