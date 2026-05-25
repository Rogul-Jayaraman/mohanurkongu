import crypto from 'node:crypto';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generatePublicId(): string {
  const bytes = crypto.randomBytes(6);
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += BASE62[bytes[i] % 62];
  }
  return `upl_${id}`;
}
