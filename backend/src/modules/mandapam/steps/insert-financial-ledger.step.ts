import type { MandapamPipelineContext } from './context.types.js';

export async function insertFinancialLedger(
  ctx: MandapamPipelineContext,
  source: 'PACKAGE' | 'ADDON' | 'ADJUSTMENT',
  getEntry: (ctx: MandapamPipelineContext) => { description: any; amount: number } | null,
): Promise<MandapamPipelineContext> {
  const tx = (ctx as any).tx;
  if (!tx) {
    const { prisma } = await import('../../../database/prisma.js');
    return insertFinancialLedgerWithPrisma(ctx, source, getEntry, prisma as any);
  }
  return insertFinancialLedgerWithPrisma(ctx, source, getEntry, tx);
}

async function insertFinancialLedgerWithPrisma(
  ctx: MandapamPipelineContext,
  source: 'PACKAGE' | 'ADDON' | 'ADJUSTMENT',
  getEntry: (ctx: MandapamPipelineContext) => { description: any; amount: number } | null,
  tx: any,
): Promise<MandapamPipelineContext> {
  const bookingId = ctx.id;
  if (!bookingId) return ctx;

  const entry = getEntry(ctx);
  if (!entry) return ctx;

  await tx.mandapamFinancialLedger.create({
    data: {
      bookingId,
      source,
      description: entry.description,
      amount: entry.amount,
    },
  });

  return ctx;
}
