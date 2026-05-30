import type { PipelineContext } from '../types.js';
import { setRefreshCookie } from '../../utils/cookie.js';

export async function setRefreshCookieStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.session?.refreshToken || !ctx.res) {
    throw new Error('Missing session or response object for cookie set');
  }

  setRefreshCookie(ctx.res, ctx.session.refreshToken, ctx.portal.cookiePath);
  return ctx;
}
