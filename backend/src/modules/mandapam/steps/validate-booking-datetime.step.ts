import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import { DateTime } from 'luxon';
import type { MandapamPipelineContext, BookingConfig } from './context.types.js';

const IST_ZONE = 'Asia/Kolkata';

export async function validateBookingDatetime(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const input = ctx.input as Record<string, unknown>;
  if (input.bookingType !== 'HOURLY') return ctx;

  const bookingConfig = input.bookingConfig as BookingConfig;
  const { startDate, startTime } = bookingConfig;
  if (!startDate || !startTime) return ctx;

  const now = DateTime.now().setZone(IST_ZONE);
  const today = now.toISODate() ?? '';

  if (startDate < today) {
    throw new AppError(400, ErrorCodes.BOOKING_INVALID_TIME, 'Cannot book a past date');
  }

  if (startDate === today) {
    const currentTime = now.toFormat('HH:mm');
    if (startTime <= currentTime) {
      throw new AppError(400, ErrorCodes.BOOKING_INVALID_TIME, 'Start time must be in the future for same-day bookings');
    }
  }

  return ctx;
}
