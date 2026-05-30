import { z } from 'zod';

export const updatePlanSchema = z.object({
  displayName: z.string().optional(),
  displayPrice: z.number().optional(),
  durationDays: z.number().int().optional(),
  openLimit: z.number().int().optional(),
  shortlistLimit: z.number().int().optional(),
  profileSlotLimit: z.number().int().optional(),
  viewDetails: z.enum(['BASIC', 'EXTENDED', 'ADVANCED', 'FULL']).optional(),
  printProfile: z.boolean().optional(),
  printHoroscope: z.boolean().optional(),
  searchLevel: z.enum(['BASIC', 'EXTENDED', 'ADVANCED', 'FULL']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const assignSubscriptionSchema = z.object({
  accountId: z.string().uuid(),
  planId: z.string().uuid(),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']).optional(),
  notes: z.string().optional(),
});

export const updateMembershipSettingSchema = z.object({
  membershipEnabled: z.boolean(),
});
