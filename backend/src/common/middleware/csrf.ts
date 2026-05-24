import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { translate } from '../utils/translation.js';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res: Response, token?: string): void {
  const value = token || generateCsrfToken();
  res.cookie(CSRF_COOKIE, value, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    const lang = res.locals.lang || 'en';
    next(new AppError(403, ErrorCodes.AUTH_FORBIDDEN, translate(ErrorCodes.AUTH_FORBIDDEN, lang)));
    return;
  }

  next();
}
