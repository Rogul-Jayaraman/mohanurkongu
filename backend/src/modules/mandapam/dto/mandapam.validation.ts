import { z } from 'zod';

const localizedTextSchema = z.object({
  en: z.string().min(1, 'English text required'),
  ta: z.string().min(1, 'Tamil text required'),
});

const bookingConfigSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').optional(),
  durationHours: z.number().int().positive().optional(),
});

const addonSelectionSchema = z.object({
  addonId: z.string().uuid(),
  amount: z.number().nonnegative(),
  quantity: z.number().int().positive().optional(),
  units: z.number().int().positive().optional(),
});

export const createBookingSchema = z.object({
  customerName: localizedTextSchema,
  customerPhone: z.string().min(10).max(20),
  customerEmail: z.string().email().optional().or(z.literal('')),
  eventTitle: localizedTextSchema,
  eventAddress: localizedTextSchema.optional(),
  bookingType: z.enum(['HOURLY', 'ONE_DAY', 'TWO_DAY']),
  eventType: z.enum(['MARRIAGE', 'RECEPTION', 'ENGAGEMENT', 'BIRTHDAY', 'BABY_SHOWER', 'EAR_PIERCING', 'PUBERTY_FUNCTION', 'OTHER']).default('OTHER'),
  bookingMethod: z.enum(['NORMAL_BOOKING', 'TOKEN_BOOKING']),
  bookingConfig: bookingConfigSchema,
  addonIds: z.array(z.string()).optional().default([]),
  addonQuantities: z.record(z.number()).optional().default({}),
  addons: z.array(addonSelectionSchema).optional().default([]),
  tokenNumber: z.string().optional(),
  advanceAmount: z.number().nonnegative().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE']).optional(),
}).refine(
  (data) => {
    if (data.bookingType === 'HOURLY') {
      return !!data.bookingConfig.startTime && !!data.bookingConfig.endTime;
    }
    return true;
  },
  { message: 'Start and end time are required for hourly bookings', path: ['bookingConfig.startTime'] },
).refine(
  (data) => {
    if (data.bookingType === 'HOURLY' && data.bookingConfig.startTime && data.bookingConfig.endTime) {
      return data.bookingConfig.endTime > data.bookingConfig.startTime;
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['bookingConfig.endTime'] },
);

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'EVENT_IN_PROGRESS', 'EVENT_COMPLETED', 'SETTLEMENT_PENDING', 'COMPLETED', 'CANCELLED']),
});

export const addPaymentSchema = z.object({
  paymentType: z.enum(['ADVANCE', 'INSTALLMENT', 'FINAL_PAYMENT']),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE']),
  amount: z.number().positive(),
  referenceNo: z.string().max(100).optional(),
});

export const addRefundSchema = z.object({
  refundType: z.enum(['PARTIAL_REFUND', 'FULL_REFUND']),
  refundMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE']),
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export const addAddonSchema = z.object({
  addonId: z.string().uuid(),
  amount: z.number().nonnegative(),
  quantity: z.number().int().positive().optional(),
  units: z.number().int().positive().optional(),
});

export const blockDatesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  reason: localizedTextSchema.optional(),
});

export const unblockDatesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
});

export const addChargesSchema = z.object({
  type: z.enum(['damage', 'penalty', 'extra']),
  description: localizedTextSchema,
  amount: z.number().positive(),
});

export const settlementActionSchema = z.object({
  action: z.enum(['start', 'complete']),
  finalAmount: z.number().positive().optional(),
  charges: z.array(addChargesSchema).optional(),
  notes: z.string().optional(),
});

export const bookingFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  packageCode: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const validateTokenSchema = z.object({
  tokenNumber: z.string().min(1, 'Token number is required'),
});
