import { prisma } from '../../../database/prisma.js';
import type { MandapamPipelineContext } from './context.types.js';

export async function generateBookingNo(ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  const counter = await prisma.counter.upsert({
    where: { prefix: 'KTM' },
    update: { counter: { increment: 1 } },
    create: { prefix: 'KTM', counter: 1 },
  });

  ctx.bookingNo = `KTM-${String(counter.counter).padStart(4, '0')}`;
  return ctx;
}
