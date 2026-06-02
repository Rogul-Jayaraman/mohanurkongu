import type { MandapamPipelineContext } from './context.types.js';

export function recordTimelineEvent(event: string, getMetadata?: (ctx: MandapamPipelineContext) => Record<string, unknown>) {
  return async (ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> => {
    const tx = (ctx as any).tx;
    const bookingId = ctx.id;
    if (!bookingId) return ctx;

    const metadata = getMetadata ? getMetadata(ctx) : {};

    if (tx) {
      await tx.mandapamBookingTimeline.create({
        data: { bookingId, event, metadata: metadata as any },
      });
    } else {
      const { prisma } = await import('../../../database/prisma.js');
      await prisma.mandapamBookingTimeline.create({
        data: { bookingId, event, metadata: metadata as any },
      });
    }

    return ctx;
  };
}
