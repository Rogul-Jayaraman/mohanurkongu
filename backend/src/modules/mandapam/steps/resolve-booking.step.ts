import { prisma } from '../../../database/prisma.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import type { MandapamPipelineContext } from './context.types.js';

export async function resolveBooking(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const bookingId = ctx.id;
  if (!bookingId) throw new AppError(400, 'VALIDATION_ERROR', 'Booking ID is required');

  const booking = await prisma.mandapamBooking.findUnique({
    where: { id: bookingId },
    include: {
      packageSnapshot: true,
      addonSnapshots: true,
      calendarEntries: true,
      ledgerEntries: { orderBy: { createdAt: 'desc' } },
      paymentEntries: { orderBy: { createdAt: 'desc' } },
      refundEntries: { orderBy: { createdAt: 'desc' } },
      tokenEntries: true,
      settlement: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      invoice: { include: { lines: true } },
    },
  });

  if (!booking) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Booking not found');

  ctx.booking = booking;
  return ctx;
}
