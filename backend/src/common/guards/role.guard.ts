import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { translate } from '../utils/translation.js';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const lang = res.locals.lang || 'en';

    if (!req.account) {
      next(new AppError(401, ErrorCodes.AUTH_UNAUTHORIZED, translate(ErrorCodes.AUTH_UNAUTHORIZED, lang)));
      return;
    }

    const hasRole = req.account.roles?.some((r) => roles.includes(r));
    if (!hasRole) {
      next(new AppError(403, ErrorCodes.AUTH_FORBIDDEN, translate(ErrorCodes.AUTH_FORBIDDEN, lang)));
      return;
    }

    next();
  };
}
