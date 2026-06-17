import { prisma } from '../../../database/prisma.js';
import type { MandapamPipelineContext } from './context.types.js';

export async function setMutationResponse(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const bookingId = ctx.id || ctx.booking?.id;
  if (!bookingId) {
    ctx.responseData = { booking: null };
    return ctx;
  }

  const [booking, ledgerAgg, paymentAgg, refundAgg] = await Promise.all([
    prisma.mandapamBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, bookingNo: true },
    }),
    prisma.mandapamFinancialLedger.aggregate({ where: { bookingId }, _sum: { amount: true } }),
    prisma.mandapamPaymentLedger.aggregate({ where: { bookingId }, _sum: { amount: true } }),
    prisma.mandapamRefundLedger.aggregate({ where: { bookingId }, _sum: { amount: true } }),
  ]);

  if (!booking) {
    ctx.responseData = { booking: null };
    return ctx;
  }

  const charges = Number(ledgerAgg._sum.amount || 0);
  const payments = Number(paymentAgg._sum.amount || 0);
  const refunds = Number(refundAgg._sum.amount || 0);

  ctx.responseData = {
    booking: {
      id: booking.id,
      bookingNo: booking.bookingNo,
      status: booking.status,
      outstandingAmount: charges - payments + refunds,
    },
  };
  return ctx;
}
