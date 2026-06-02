import type { MandapamPipelineContext, MandapamStep } from './context.types.js';

export const mandapamFlushCacheInvalidations: MandapamStep = async (ctx: MandapamPipelineContext): Promise<MandapamPipelineContext> => {
  if (!ctx.cacheManager) return ctx;
  const tags = ctx.cacheInvalidations?.tags;
  if (!tags || tags.length === 0) return ctx;

  try {
    const flushed = await ctx.cacheManager.flushTags([...new Set(tags)]);
    ctx.cacheInvalidationsLog = { tags: [...new Set(tags)], flushed };
  } catch (err) {
    ctx.cacheInvalidationsLog = { tags: [...new Set(tags)], flushed: 0 };
    ctx.logger?.warn?.({ err, tags }, 'mandapamFlushCacheInvalidations failed (non-critical)');
  }
  return ctx;
};

export function addCacheInvalidationTag(ctx: MandapamPipelineContext, tag: string): void {
  if (!ctx.cacheInvalidations) {
    ctx.cacheInvalidations = { tags: [] };
  }
  if (!ctx.cacheInvalidations.tags.includes(tag)) {
    ctx.cacheInvalidations.tags.push(tag);
  }
}

export function addCacheInvalidationTags(ctx: MandapamPipelineContext, tags: string[]): void {
  for (const tag of tags) {
    addCacheInvalidationTag(ctx, tag);
  }
}
