import type { MandapamPipelineContext, MandapamStep } from './context.types.js';

export function mandapamCacheRead(tags: string[]): MandapamStep {
  return async (ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> => {
    if (!ctx.cacheManager) return ctx;
    if (!ctx.cacheEnabled) return ctx;
    if (ctx.cacheResolved) return ctx;
    if (tags.length === 0) return ctx;

    const readResult: Record<string, unknown> = { ...(ctx.cacheReadResult ?? {}) };
    for (const tag of tags) {
      const raw = await ctx.cacheManager.get(tag);
      if (raw === null) {
        ctx.cacheResolved = false;
        return ctx;
      }
      readResult[tag] = raw;
    }

    ctx.cacheReadResult = readResult;
    ctx.cacheResolved = true;

    return ctx;
  };
}
