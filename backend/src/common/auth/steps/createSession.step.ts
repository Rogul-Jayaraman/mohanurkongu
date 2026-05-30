import type { PipelineContext } from '../types.js';
import type { SessionService } from '../../../modules/session/session.service.js';

export function createCreateSessionStep(sessionService: SessionService) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.accountId || !ctx.roles || ctx.tokenVersion === undefined) {
      throw new Error('Missing account context for session creation');
    }

    const result = await sessionService.createSession(
      ctx.accountId,
      ctx.roles,
      ctx.tokenVersion,
      ctx.device,
    );

    ctx.session = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
    };

    return ctx;
  };
}
