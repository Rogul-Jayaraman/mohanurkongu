import { prisma } from '../../../database/prisma.js';
import type { MandapamPipelineContext } from './context.types.js';

export async function setBookingResponse(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const bookingId = ctx.id || ctx.booking?.id;
  if (!bookingId) return ctx;

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

  ctx.responseData = { booking };
  return ctx;
}
