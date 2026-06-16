import { AppError } from '../../../common/errors/AppError.js';
import type { MandapamPipelineContext, SettlementAction } from './context.types.js';

export async function upsertSettlement(ctx: MandapamPipelineContext, action: SettlementAction): Promise<MandapamPipelineContext> {
  const tx = (ctx as any).tx;
  if (!tx) {
    const { prisma } = await import('../../../database/prisma.js');
    return upsertSettlementWithPrisma(ctx, action, prisma as any);
  }
  return upsertSettlementWithPrisma(ctx, action, tx);
}

async function upsertSettlementWithPrisma(ctx: MandapamPipelineContext, action: SettlementAction, tx: any): Promise<MandapamPipelineContext> {
  const bookingId = ctx.id;
  if (!bookingId) return ctx;

  if (action === 'INITIATE') {
    await tx.mandapamSettlement.upsert({
      where: { bookingId },
      update: {},
      create: { bookingId, state: 'PENDING' },
    });
  }

  if (action === 'START_SETTLEMENT') {
    await tx.mandapamSettlement.upsert({
      where: { bookingId },
      update: { state: 'IN_PROGRESS' },
      create: { bookingId, state: 'IN_PROGRESS' },
    });
  }

  if (action === 'COMPLETE') {
    const dto = ctx.input as any;
    const settlement = await tx.mandapamSettlement.findUnique({ where: { bookingId } });
    if (!settlement) throw new AppError(400, 'INVALID_SETTLEMENT_STATE', 'No settlement record found');

    if (dto.charges) {
      for (const charge of dto.charges) {
        const source = charge.type === 'damage' ? 'DAMAGE' : charge.type === 'penalty' ? 'PENALTY' : 'SERVICE';
        await tx.mandapamFinancialLedger.create({
          data: { bookingId, source, description: charge.description, amount: charge.amount },
        });
      }
    }

    if (dto.finalAmount != null) {
      const allLedgers = await tx.mandapamFinancialLedger.findMany({ where: { bookingId } });
      const charges = allLedgers.reduce((s: number, e: any) => s + Number(e.amount), 0);
      const payments = (ctx.booking?.paymentEntries || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      const refunds = (ctx.booking?.refundEntries || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      const currentOutstanding = charges - payments + refunds;
      const discountAmount = currentOutstanding - dto.finalAmount;

      if (discountAmount > 0) {
        await tx.mandapamFinancialLedger.create({
          data: {
            bookingId,
            source: 'DISCOUNT',
            description: { en: 'Settlement discount applied', ta: 'தீர்வு தள்ளுபடி' },
            amount: -discountAmount,
          },
        });
      }
    }

    const allChargeLedgers = await tx.mandapamFinancialLedger.findMany({
      where: { bookingId, source: { in: ['DAMAGE', 'PENALTY', 'SERVICE'] } },
    });

    const damageCharges = allChargeLedgers.filter((e: any) => e.source === 'DAMAGE').map((e: any) => ({
      type: 'damage', description: e.description, amount: Number(e.amount),
    }));
    const penaltyCharges = allChargeLedgers.filter((e: any) => e.source === 'PENALTY').map((e: any) => ({
      type: 'penalty', description: e.description, amount: Number(e.amount),
    }));
    const extraCharges = allChargeLedgers.filter((e: any) => e.source === 'SERVICE').map((e: any) => ({
      type: 'extra', description: e.description, amount: Number(e.amount),
    }));

    await tx.mandapamSettlement.update({
      where: { bookingId },
      data: {
        state: 'COMPLETED',
        damageCharges: damageCharges.length ? JSON.parse(JSON.stringify(damageCharges)) : undefined,
        penaltyCharges: penaltyCharges.length ? JSON.parse(JSON.stringify(penaltyCharges)) : undefined,
        extraCharges: extraCharges.length ? JSON.parse(JSON.stringify(extraCharges)) : undefined,
        finalAmount: dto.finalAmount ?? null,
        settledAt: new Date(),
        settledBy: ctx.performedBy,
        notes: dto.notes ?? null,
      },
    });
  }

  return ctx;
}
