import type { PipelineContext } from '../../auth/types.js';

export const flushCacheInvalidations = async (ctx: PipelineContext): Promise<PipelineContext> => {
  if (!ctx.cacheManager) return ctx;
  const tags = ctx.cacheInvalidations?.tags;
  if (!tags || tags.length === 0) return ctx;

  try {
    const flushed = await ctx.cacheManager.flushTags([...new Set(tags)]);
    ctx.cacheInvalidationsLog = { tags: [...new Set(tags)], flushed };
  } catch (err) {
    ctx.cacheInvalidationsLog = { tags: [...new Set(tags)], flushed: 0 };
    ctx.logger?.warn?.({ err, tags }, 'flushCacheInvalidations failed (non-critical)');
  }
  return ctx;
};

export function addCacheInvalidationTag(ctx: PipelineContext, tag: string): void {
  if (!ctx.cacheInvalidations) {
    ctx.cacheInvalidations = { tags: [] };
  }
  if (!ctx.cacheInvalidations.tags.includes(tag)) {
    ctx.cacheInvalidations.tags.push(tag);
  }
}

export function addCacheInvalidationTags(ctx: PipelineContext, tags: string[]): void {
  for (const tag of tags) {
    addCacheInvalidationTag(ctx, tag);
  }
}
