import { prisma } from '../../../database/prisma.js';
import type { MandapamPipelineContext, MandapamStep } from './context.types.js';

export async function runSteps(steps: MandapamStep[], ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  for (const step of steps) {
    ctx = await step(ctx);
  }
  return ctx;
}

export async function runInTransaction(steps: MandapamStep[], ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> {
  return prisma.$transaction(async (tx) => {
    (ctx as any).tx = tx;
    ctx = await runSteps(steps, ctx);
    delete (ctx as any).tx;
    return ctx;
  });
}
