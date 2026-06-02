import type { MandapamPipelineContext } from './context.types.js';

export async function computeOutstanding(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const booking = ctx.booking;
  if (!booking) return ctx;

  const ledgerEntries = booking.ledgerEntries || [];
  const paymentEntries = booking.paymentEntries || [];
  const refundEntries = booking.refundEntries || [];

  const totalCharges = ledgerEntries.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalPayments = paymentEntries.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalRefunds = refundEntries.reduce((s: number, e: any) => s + Number(e.amount), 0);

  ctx.booking._outstanding = totalCharges - totalPayments + totalRefunds;
  ctx.booking._totalCharges = totalCharges;
  ctx.booking._totalPayments = totalPayments;
  ctx.booking._totalRefunds = totalRefunds;

  return ctx;
}
