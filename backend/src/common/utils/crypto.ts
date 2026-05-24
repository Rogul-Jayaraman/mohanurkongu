import argon2 from 'argon2';
import { authConfig } from '../../config/auth.config.js';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: authConfig.argon2.memory,
    timeCost: authConfig.argon2.iterations,
    parallelism: authConfig.argon2.parallelism,
    hashLength: authConfig.argon2.hashLength,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}


