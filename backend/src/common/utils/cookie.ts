import type { Response } from 'express';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function setRefreshCookie(res: Response, refreshToken: string, path: string): void {
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    path,
  });
}

export function clearRefreshCookie(res: Response, path: string): void {
  res.clearCookie('refreshToken', { path, httpOnly: true, sameSite: 'strict' as const });
}
