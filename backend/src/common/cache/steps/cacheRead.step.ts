import type { PipelineContext } from '../../auth/types.js';

export function cacheRead(tags: string[]) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
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

    const firstTag = tags[0];
    const firstValue = readResult[firstTag];
    if (firstTag.startsWith('profile:') && !firstTag.startsWith('profile-list:')) {
      ctx.rawProfile = firstValue;
    } else if (firstTag.startsWith('account:') && firstTag.endsWith(':auth-me')) {
      ctx.rawAccount = firstValue;
    } else if (firstTag.startsWith('profile-list:user:')) {
      ctx.rawBrowseResult = firstValue;
    } else if (firstTag.startsWith('my-profiles:')) {
      ctx.rawMyProfiles = firstValue;
    }

    return ctx;
  };
}
