import type { MandapamPipelineContext, CalendarReservation, BookingType, BookingConfig } from './context.types.js';

export async function buildReservations(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const bookingType = ctx.input.bookingType as BookingType;
  const bookingConfig = ctx.input.bookingConfig as BookingConfig;
  const startDate = bookingConfig.startDate;
  const endDate = bookingConfig.endDate || startDate;

  let dates: string[] = [];
  let reservations: CalendarReservation[] = [];

  if (bookingType === 'HOURLY') {
    dates = [startDate];
    reservations = [{
      date: new Date(startDate + 'T00:00:00.000Z'),
      startTime: bookingConfig.startTime,
      endTime: bookingConfig.endTime,
    }];
  } else {
    const current = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      dates.push(dateStr);
      reservations.push({ date: new Date(current) });
      current.setDate(current.getDate() + 1);
    }
  }

  ctx.dates = dates;
  ctx.reservations = reservations;
  return ctx;
}
