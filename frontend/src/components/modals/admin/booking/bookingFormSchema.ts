import { z } from 'zod';

export const bookingFormSchema = z
  .object({
    bookingType: z.enum(['HOURLY', 'ONE_DAY', 'TWO_DAY']),
    bookingMethod: z.enum(['NORMAL_BOOKING', 'TOKEN_BOOKING']),
    selectedDates: z.array(z.string()).min(1, 'At least one date is required'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    durationHours: z.number().optional(),
    contactName: z.object({
      en: z.string().min(1, 'Name is required'),
      ta: z.string().optional(),
    }),
    phone: z.string().min(10, 'Phone number is required'),
    email: z.string().email().optional().or(z.literal('')),
    doorNo: z.string().optional(),
    landmark: z.object({
      en: z.string().optional(),
      ta: z.string().optional(),
    }).optional(),
    district: z.string().optional(),
    taluk: z.string().optional(),
    eventName: z.object({
      en: z.string().min(1, 'Event name is required'),
      ta: z.string().optional(),
    }),
    eventType: z.enum([
      'MARRIAGE',
      'RECEPTION',
      'ENGAGEMENT',
      'BIRTHDAY',
      'BABY_SHOWER',
      'EAR_PIERCING',
      'PUBERTY_FUNCTION',
      'OTHER',
    ]),
    addonIds: z.array(z.string()).default([]),
    addonQuantities: z.record(z.number()).default({}),
    addonAmounts: z.record(z.number()).default({}),
    addonUnits: z.record(z.number()).default({}),
    advanceAmount: z.number().nonnegative().optional(),
    paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE']).optional(),
    tokenNumber: z.string().optional(),
    tokenNumber2: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.bookingType === 'HOURLY') {
        return !!data.startTime && !!data.endTime;
      }
      return true;
    },
    { message: 'Start and end time are required for hourly bookings', path: ['startTime'] },
  )
  .refine(
    (data) => {
      if (data.bookingType === 'HOURLY' && data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  )
  .refine(
    (data) => {
      if (data.bookingType !== 'HOURLY' || !data.selectedDates?.[0] || !data.startTime) return true;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (data.selectedDates[0] !== today) return true;
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return data.startTime > currentHHMM;
    },
    { message: 'Start time must be in the future', path: ['startTime'] },
  )
  .refine(
    (data) => {
      if (data.bookingType !== 'HOURLY' && data.bookingMethod === 'TOKEN_BOOKING') {
        if (!data.tokenNumber) return false;
        const num = parseInt(data.tokenNumber.replace(/^MK/, ''), 10);
        return num >= 1 && num <= 6000;
      }
      return true;
    },
    { message: 'Valid token number required (MK0001-MK6000)', path: ['tokenNumber'] },
  )
  .refine(
    (data) => {
      if (data.bookingType === 'TWO_DAY' && data.bookingMethod === 'TOKEN_BOOKING') {
        if (!data.tokenNumber2) return false;
        const num = parseInt(data.tokenNumber2.replace(/^MK/, ''), 10);
        return num >= 1 && num <= 6000;
      }
      return true;
    },
    { message: 'Valid second token number required (MK0001-MK6000)', path: ['tokenNumber2'] },
  );
