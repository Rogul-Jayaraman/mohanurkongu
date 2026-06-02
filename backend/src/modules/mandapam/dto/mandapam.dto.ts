import { z } from 'zod';

const languageSchema = z.object({
  language: z.enum(['EN', 'TA']),
  value: z.string().min(1).max(255),
});

const translationsSchema = z.array(languageSchema).min(1);

export const createFunctionSchema = z.object({
  packageId: z.string().uuid(),
  name: translationsSchema,
});

export const updateFunctionSchema = z.object({
  name: translationsSchema.optional(),
  status: z.boolean().optional(),
});

export const createFacilitySchema = z.object({
  iconName: z.string().min(1).max(100),
  name: translationsSchema,
});

export const updateFacilitySchema = z.object({
  iconName: z.string().min(1).max(100).optional(),
  name: translationsSchema.optional(),
  status: z.boolean().optional(),
});

export const createAddonSchema = z.object({
  iconName: z.string().min(1).max(100),
  pricingType: z.enum(['PER_EVENT', 'PER_HOUR', 'PER_DAY']).optional(),
  supportsQuantity: z.boolean().optional(),
  name: translationsSchema,
});

export const updateAddonSchema = z.object({
  iconName: z.string().min(1).max(100).optional(),
  pricingType: z.enum(['PER_EVENT', 'PER_HOUR', 'PER_DAY']).optional(),
  supportsQuantity: z.boolean().optional(),
  name: translationsSchema.optional(),
  status: z.boolean().optional(),
});
