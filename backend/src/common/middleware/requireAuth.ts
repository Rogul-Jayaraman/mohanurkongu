import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { translate } from '../utils/translation.js';
import type { AccessTokenPayload } from '../utils/jwt.js';
import { prisma } from '../../database/prisma.js';

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

export async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    const account = await prisma.account.findUnique({
      where: { id: payload.sub },
      select: { currentState: true, tokenVersion: true },
    });

    if (!account) {
      throw new AppError(401, ErrorCodes.ACCOUNT_NOT_FOUND, translate(ErrorCodes.ACCOUNT_NOT_FOUND, res.locals.lang));
    }

    if (account.currentState === 'SUSPENDED') {
      throw new AppError(403, ErrorCodes.AUTH_ACCOUNT_SUSPENDED, translate(ErrorCodes.AUTH_ACCOUNT_SUSPENDED, res.locals.lang));
    }

    if (payload.tver !== undefined && payload.tver !== account.tokenVersion) {
      throw new AppError(401, ErrorCodes.AUTH_SESSION_EXPIRED, translate(ErrorCodes.AUTH_SESSION_EXPIRED, res.locals.lang));
    }

    req.account = {
      sub: payload.sub,
      roles: payload.roles,
      tver: payload.tver,
      type: 'access',
    };

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
