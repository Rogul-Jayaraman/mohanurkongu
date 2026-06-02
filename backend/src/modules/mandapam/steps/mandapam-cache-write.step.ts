import type { MandapamPipelineContext, MandapamStep } from './context.types.js';

export function mandapamCacheWrite(
  tags: string[],
  ttl: number,
  dataSelector: (ctx: MandapamPipelineContext) => unknown,
): MandapamStep {
  return async (ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> => {
    if (!ctx.cacheManager) return ctx;
    if (!ctx.cacheEnabled) return ctx;
    if (ctx.cacheResolved) return ctx;
    if (tags.length === 0) return ctx;

    try {
      const data = dataSelector(ctx);
      if (data === undefined || data === null) return ctx;
      await ctx.cacheManager.setByTags(tags, data, { defaultTtl: ttl });
    } catch (err) {
      ctx.logger?.warn?.({ err, tags }, 'mandapamCacheWrite step failed');
    }
    return ctx;
  };
}
