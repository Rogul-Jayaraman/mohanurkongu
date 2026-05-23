import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.js';

describe('JWT Utils', () => {
  it('should sign and verify access token', () => {
    const payload = { sub: 'user-1', roles: ['USER'] };
    const token = signAccessToken(payload);
    expect(token).toBeTruthy();

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.roles).toContain('USER');
    expect(decoded.type).toBe('access');
  });

  it('should sign and verify refresh token', () => {
    const payload = { sub: 'user-1', jti: 'session-1', tver: 1 };
    const token = signRefreshToken(payload);
    expect(token).toBeTruthy();

    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.jti).toBe('session-1');
    expect(decoded.tver).toBe(1);
    expect(decoded.type).toBe('refresh');
  });

  it('should reject invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });
});
