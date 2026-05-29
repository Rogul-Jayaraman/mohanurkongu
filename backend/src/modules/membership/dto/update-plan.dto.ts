import { z } from 'zod';

export const updatePlanSchema = z.object({
  displayPrice: z.number().optional(),
  durationDays: z.number().int().optional(),
  openLimit: z.number().int().optional(),
  shortlistLimit: z.number().int().optional(),
  profileSlotLimit: z.number().int().optional(),
  contactAccess: z.boolean().optional(),
  fullHoroscopeAccess: z.boolean().optional(),
  printProfile: z.boolean().optional(),
  printHoroscope: z.boolean().optional(),
  searchLevel: z.enum(['BASIC', 'EXTENDED', 'ADVANCED', 'FULL']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const assignSubscriptionSchema = z.object({
  accountId: z.string().uuid(),
  planId: z.string().uuid(),
  notes: z.string().optional(),
});

export const updateMembershipSettingSchema = z.object({
  membershipEnabled: z.boolean(),
});
