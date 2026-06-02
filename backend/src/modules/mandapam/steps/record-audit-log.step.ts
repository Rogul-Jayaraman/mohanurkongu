import type { MandapamPipelineContext } from './context.types.js';

export function recordAuditLog(action: string, getMetadata?: (ctx: MandapamPipelineContext) => Record<string, unknown>) {
  return async (ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> => {
    const tx = (ctx as any).tx;
    const bookingId = ctx.id;
    const performedBy = ctx.performedBy;
    if (!bookingId) return ctx;

    const metadata = getMetadata ? getMetadata(ctx) : {};

    if (tx) {
      await tx.mandapamAuditLog.create({
        data: { bookingId, action, performedBy, metadata: metadata as any },
      });
    } else {
      const { prisma } = await import('../../../database/prisma.js');
      await prisma.mandapamAuditLog.create({
        data: { bookingId, action, performedBy, metadata: metadata as any },
      });
    }

    return ctx;
  };
}
