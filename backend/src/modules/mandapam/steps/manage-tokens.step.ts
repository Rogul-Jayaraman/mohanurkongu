import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import type { MandapamPipelineContext, TokenAction } from './context.types.js';

export async function manageTokens(ctx: MandapamPipelineContext, action: TokenAction): Promise<MandapamPipelineContext> {
  const tx = (ctx as any).tx;
  if (!tx) {
    const { prisma } = await import('../../../database/prisma.js');
    return manageTokensWithPrisma(ctx, action, prisma as any);
  }
  return manageTokensWithPrisma(ctx, action, tx);
}

async function consumeOneToken(tx: any, tokenId: string, newBookingId: string): Promise<void> {
  const token = await tx.mandapamToken.findUnique({
    where: { tokenId },
  });

  if (!token) {
    throw new AppError(400, 'INVALID_TOKEN', `Token ${tokenId} not found`);
  }

  if (token.status !== 'NOTUSED') {
    throw new AppError(400, ErrorCodes.BOOKING_CANCELLED, `Token ${tokenId} is already ${token.status === 'USED' ? 'used' : 'reserved'}`);
  }

  await tx.mandapamToken.update({
    where: { id: token.id },
    data: { status: 'USED', bookingId: newBookingId },
  });

  await tx.mandapamTokenConsumption.create({
    data: { bookingId: newBookingId, tokens: 1, state: 'CONSUMED' },
  });
}

async function manageTokensWithPrisma(ctx: MandapamPipelineContext, action: TokenAction, tx: any): Promise<MandapamPipelineContext> {
  const bookingId = ctx.id;
  if (!bookingId) return ctx;

  if (action === 'ISSUE') {
    const tokenCount = ctx.package?.tokenCount ?? 0;
    if (tokenCount <= 0) return ctx;
    await tx.mandapamTokenConsumption.create({
      data: { bookingId, tokens: tokenCount, state: 'ISSUED' },
    });
  }

  if (action === 'CONSUME') {
    const tokenNumber = ctx.input.tokenNumber as string | undefined;
    const tokenNumber2 = ctx.input.tokenNumber2 as string | undefined;
    if (!tokenNumber) return ctx;

    await consumeOneToken(tx, tokenNumber, bookingId);

    if (tokenNumber2) {
      await consumeOneToken(tx, tokenNumber2, bookingId);
    }
  }

  if (action === 'REVERSE') {
    await tx.mandapamToken.updateMany({
      where: { bookingId, status: 'USED' },
      data: { status: 'NOTUSED', bookingId: null },
    });
    await tx.mandapamTokenConsumption.updateMany({
      where: { bookingId, state: 'CONSUMED' },
      data: { state: 'REVERSED', reversedAt: new Date() },
    });
  }

  return ctx;
}
