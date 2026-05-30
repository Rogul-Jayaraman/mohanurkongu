import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import type { SessionService } from '../../../modules/session/session.service.js';

export function createRotateSessionStep(sessionService: SessionService) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    const refreshToken = ctx.input.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, 'AUTH_TOKEN_INVALID');
    }

    const result = await sessionService.rotateSession(refreshToken, ctx.device);

    ctx.session = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
    };

    return ctx;
  };
}
