import type { PipelineContext } from '../types.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { verifyVerificationToken, verifyResetToken } from '../../utils/jwt.js';

export function createValidateVerificationTokenStep(expectedPurpose: 'register' | 'reset_password') {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    const token = ctx.input.verificationToken || ctx.input.resetToken;

    if (!token) {
      const errorCode = expectedPurpose === 'register'
        ? ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID
        : ErrorCodes.AUTH_RESET_SESSION_INVALID;
      throw new AppError(400, errorCode, errorCode);
    }

    try {
      if (expectedPurpose === 'register') {
        const payload = verifyVerificationToken(token as string);
        if (payload.type !== 'verification' || payload.purpose !== 'register') {
          throw new Error();
        }
        ctx.verificationId = payload.sub;
      } else {
        const payload = verifyResetToken(token as string);
        if (payload.type !== 'reset' || payload.purpose !== 'reset_password') {
          throw new Error();
        }
        ctx.verificationId = payload.sub;
      }
    } catch {
      const errorCode = expectedPurpose === 'register'
        ? ErrorCodes.AUTH_REGISTRATION_SESSION_INVALID
        : ErrorCodes.AUTH_RESET_SESSION_INVALID;
      throw new AppError(400, errorCode, errorCode);
    }

    return ctx;
  };
}
