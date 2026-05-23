import jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth.config.js';

export interface AccessTokenPayload {
  sub: string;
  roles: string[];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tver: number;
  type: 'refresh';
}

export function signAccessToken(payload: { sub: string; roles: string[] }): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    authConfig.jwt.accessSecret,
    { expiresIn: authConfig.jwt.accessExpiresIn as string | number } as jwt.SignOptions,
  );
}

export function signRefreshToken(payload: { sub: string; jti: string; tver: number }): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    authConfig.jwt.refreshSecret,
    { expiresIn: authConfig.jwt.refreshExpiresIn as string | number } as jwt.SignOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, authConfig.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, authConfig.jwt.refreshSecret) as RefreshTokenPayload;
}
