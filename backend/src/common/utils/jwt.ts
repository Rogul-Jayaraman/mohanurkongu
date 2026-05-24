import jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth.config.js';

export interface AccessTokenPayload {
  sub: string;
  roles: string[];
  tver: number;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tver: number;
  type: 'refresh';
}

export interface VerificationTokenPayload {
  sub: string;
  purpose: 'register' | 'reset_password';
  type: 'verification';
}

export interface ResetTokenPayload {
  sub: string;
  purpose: 'reset_password';
  type: 'reset';
}

export function signAccessToken(payload: { sub: string; roles: string[]; tver: number }): string {
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

export function signVerificationToken(payload: { sub: string; purpose: 'register' | 'reset_password' }): string {
  return jwt.sign(
    { ...payload, type: 'verification' },
    authConfig.jwt.verificationSecret,
    { expiresIn: authConfig.jwt.verificationExpiresIn as string | number } as jwt.SignOptions,
  );
}

export function signResetToken(payload: { sub: string; purpose: 'reset_password' }): string {
  return jwt.sign(
    { ...payload, type: 'reset' },
    authConfig.jwt.resetSecret,
    { expiresIn: authConfig.jwt.resetExpiresIn as string | number } as jwt.SignOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, authConfig.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, authConfig.jwt.refreshSecret) as RefreshTokenPayload;
}

export function verifyVerificationToken(token: string): VerificationTokenPayload {
  return jwt.verify(token, authConfig.jwt.verificationSecret) as VerificationTokenPayload;
}

export function verifyResetToken(token: string): ResetTokenPayload {
  return jwt.verify(token, authConfig.jwt.resetSecret) as ResetTokenPayload;
}
