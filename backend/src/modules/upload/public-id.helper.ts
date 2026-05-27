import crypto from 'node:crypto';

export function generateUploadToken(): string {
  return generatePublicId();
}

export function generatePublicId(): string {
  const bytes = crypto.randomBytes(6);
  const hex = bytes.toString('hex');
  return `upl_${hex}`;
}
