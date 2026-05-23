import type { Request } from 'express';
import { sha256 } from './hash.js';

export interface DeviceInfo {
  ipHash: string;
  userAgentHash: string;
  fingerprint: string;
}

export function getDeviceInfo(req: Request): DeviceInfo {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLang = req.headers['accept-language'] || '';
  const accept = req.headers['accept'] || '';

  const fingerprint = sha256(`${ip}|${userAgent}|${acceptLang}|${accept}`);

  return {
    ipHash: sha256(ip),
    userAgentHash: sha256(userAgent),
    fingerprint,
  };
}
