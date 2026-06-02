import type { PipelineContext } from '../../auth/types.js';

export function cacheWrite(
  tags: string[],
  ttl: number,
  dataSelector: (ctx: PipelineContext) => unknown,
) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.cacheManager) return ctx;
    if (!ctx.cacheEnabled) return ctx;
    if (ctx.cacheResolved) return ctx;
    if (tags.length === 0) return ctx;

    try {
      const data = dataSelector(ctx);
      if (data === undefined || data === null) return ctx;
      await ctx.cacheManager.setByTags(tags, data, { defaultTtl: ttl });
    } catch (err) {
      // Non-critical — swallow and log
      ctx.logger?.warn?.({ err, tags }, 'cacheWrite step failed');
    }
    return ctx;
  };
}
