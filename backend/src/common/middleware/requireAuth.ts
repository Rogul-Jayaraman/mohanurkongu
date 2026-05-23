import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { translate } from '../utils/translation.js';
import type { AccessTokenPayload } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
      account: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, translate(ErrorCodes.AUTH_UNAUTHORIZED, res.locals.lang));
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, translate(ErrorCodes.AUTH_TOKEN_INVALID, res.locals.lang));
    }

    req.account = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError(401, ErrorCodes.AUTH_TOKEN_INVALID, translate(ErrorCodes.AUTH_TOKEN_INVALID, res.locals.lang)));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.account = verifyAccessToken(token);
    }
  } catch {
    // ignore
  }
  next();
}
