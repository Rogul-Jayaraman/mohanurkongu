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
      tokens: true,
      settlement: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      invoice: { include: { lines: true } },
    },
  });

  if (!booking) {
    ctx.responseData = { booking: null };
    return ctx;
  }

  const charges = (booking as any).ledgerEntries?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0;
  const payments = (booking as any).paymentEntries?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0;
  const refunds = (booking as any).refundEntries?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0;

  ctx.responseData = {
    booking: {
      ...booking,
      totalCharges: charges,
      totalPayments: payments,
      totalRefunds: refunds,
      outstandingAmount: charges - payments + refunds,
    },
  };
  return ctx;
}
