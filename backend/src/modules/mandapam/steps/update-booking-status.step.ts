import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import type { MandapamPipelineContext } from './context.types.js';
import { VALID_STATUS_TRANSITIONS } from './context.types.js';

export async function updateBookingStatus(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const tx = (ctx as any).tx;
  if (!tx) {
    throw new AppError(500, 'TRANSACTION_REQUIRED', 'Must run within a transaction');
  }

  const bookingId = ctx.id;
  const newStatus = ctx.input.status as string;
  const currentStatus = ctx.booking?.status as string;

  if (!bookingId || !newStatus) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Booking ID and status are required');
  }

  const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new AppError(400, ErrorCodes.INVALID_STATUS_TRANSITION, `Cannot transition from ${currentStatus} to ${newStatus}`);
  }

  await tx.mandapamBooking.update({
    where: { id: bookingId },
    data: { status: newStatus as any },
  });

  return ctx;
}
