import { z } from 'zod';

const languageSchema = z.object({
  language: z.enum(['EN', 'TA']),
  value: z.string().min(1).max(255),
});

const translationsSchema = z.array(languageSchema).min(1);

const PACKAGE_CODES = ['STANDARD', 'ROYAL', 'GRAND'] as const;

export const updatePackageSchema = z.object({
  displayName: translationsSchema.optional(),
  functions: z.array(z.object({
    id: z.string().uuid().optional(),
    name: translationsSchema,
    status: z.boolean().optional(),
  })).optional(),
  pricing: z.object({
    amount: z.number().positive().optional(),
    currencyCode: z.string().length(3).optional(),
    isActive: z.boolean().optional(),
  }).optional(),
  status: z.boolean().optional(),
});

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
  chargeType: z.enum(['GENERAL', 'ADDITIONAL']).optional(),
  name: translationsSchema,
});

export const updateFacilitySchema = z.object({
  iconName: z.string().min(1).max(100).optional(),
  chargeType: z.enum(['GENERAL', 'ADDITIONAL']).optional(),
  name: translationsSchema.optional(),
  status: z.boolean().optional(),
});

export const createAddonSchema = z.object({
  iconName: z.string().min(1).max(100),
  pricingType: z.enum(['HOURLY', 'FIXED']).optional(),
  amount: z.number().positive().optional(),
  name: translationsSchema,
});

export const updateAddonSchema = z.object({
  iconName: z.string().min(1).max(100).optional(),
  pricingType: z.enum(['HOURLY', 'FIXED']).optional(),
  amount: z.number().positive().optional(),
  name: translationsSchema.optional(),
  status: z.boolean().optional(),
});
