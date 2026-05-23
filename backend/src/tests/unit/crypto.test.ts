import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../common/utils/crypto.js';

describe('Crypto Utils', () => {
  it('should hash and verify password correctly', async () => {
    const password = 'Test1234!';
    const hash = await hashPassword(password);
    expect(hash).toBeTruthy();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const valid = await verifyPassword(hash, password);
    expect(valid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await hashPassword('Test1234!');
    const valid = await verifyPassword(hash, 'WrongPassword1!');
    expect(valid).toBe(false);
  });
});
