import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import type { MandapamPipelineContext, CalendarAction, CalendarReservation } from './context.types.js';

function timeToString(t: Date | string): string {
  if (typeof t === 'string') return t;
  return `${t.getUTCHours().toString().padStart(2, '0')}:${t.getUTCMinutes().toString().padStart(2, '0')}`;
}

function timeToDate(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

export async function manageCalendarReservations(ctx: MandapamPipelineContext, action: CalendarAction): Promise<MandapamPipelineContext> {
  const tx = (ctx as any).tx;
  if (!tx) {
    const { prisma } = await import('../../../database/prisma.js');
    return manageCalendarReservationsWithPrisma(ctx, action, prisma as any);
  }
  return manageCalendarReservationsWithPrisma(ctx, action, tx);
}

async function manageCalendarReservationsWithPrisma(ctx: MandapamPipelineContext, action: CalendarAction, tx: any): Promise<MandapamPipelineContext> {
  const reservations: CalendarReservation[] = ctx.reservations || [];

  if (action === 'VALIDATE') {
    for (const res of reservations) {
      const date = new Date(res.date);
      date.setUTCHours(0, 0, 0, 0);

      const existingEntries = await tx.mandapamCalendarEntry.findMany({ where: { date } });
      if (existingEntries.length === 0) continue;

      for (const entry of existingEntries) {
        if (entry.status === 'BLOCKED') {
          throw new AppError(409, ErrorCodes.DATE_BLOCKED, `Date ${date.toISOString().split('T')[0]} is blocked`);
        }

        if (ctx.id && entry.bookingId === ctx.id) continue;

        if (entry.status === 'FULLY_BOOKED') {
          throw new AppError(409, ErrorCodes.DATE_ALREADY_BOOKED, `Date ${date.toISOString().split('T')[0]} is already fully booked`);
        }

        if (!res.startTime || !res.endTime) {
          throw new AppError(409, 'TIME_CONFLICT', `Date ${date.toISOString().split('T')[0]} already has hourly bookings — full day not available`);
        }

        if (entry.startTime && entry.endTime) {
          const newStart = res.startTime;
          const newEnd = res.endTime;
          const existingStart = timeToString(entry.startTime);
          const existingEnd = timeToString(entry.endTime);

          if (newStart < existingEnd && newEnd > existingStart) {
            throw new AppError(409, 'TIME_CONFLICT', `Time slot conflicts with existing booking on ${date.toISOString().split('T')[0]}`);
          }
        }
      }
    }
  }

  if (action === 'CREATE') {
    const bookingId = ctx.id;
    if (!bookingId) return ctx;

    for (const res of reservations) {
      const date = new Date(res.date);
      date.setUTCHours(0, 0, 0, 0);

      const existing = await tx.mandapamCalendarEntry.findFirst({ where: { date, bookingId } });
      if (existing) continue;

      const isFullDay = !res.startTime && !res.endTime;

      await tx.mandapamCalendarEntry.create({
        data: {
          date,
          startTime: res.startTime ? timeToDate(date, res.startTime) : null,
          endTime: res.endTime ? timeToDate(date, res.endTime) : null,
          status: isFullDay ? 'FULLY_BOOKED' : 'PARTIALLY_BOOKED',
          bookingId,
        },
      });
    }
  }

  if (action === 'RELEASE') {
    const bookingId = ctx.id;
    if (!bookingId) return ctx;

    await tx.mandapamCalendarEntry.updateMany({
      where: { bookingId },
      data: { status: 'AVAILABLE', bookingId: null },
    });
  }

  return ctx;
}
