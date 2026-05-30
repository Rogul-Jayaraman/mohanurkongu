import type { DeviceInfo } from '../utils/device.js';

export interface CapabilitySnapshot {
  planCode: string;
  planName: string;
  openLimit: number;
  shortlistLimit: number;
  profileSlotLimit: number;
  viewDetails: string;
  printProfile: boolean;
  printHoroscope: boolean;
  searchLevel: string;
  isActive: boolean;
  expiresAt: string | null;
}

export interface PortalConfig {
  role: 'USER' | 'ADMIN';
  cookiePath: string;
  refreshPath: string;
  profileEndpoint: string;
}

export const PORTAL_CONFIGS: Record<'USER' | 'ADMIN', PortalConfig> = {
  USER: {
    role: 'USER',
    cookiePath: '/auth',
    refreshPath: '/auth/refresh',
    profileEndpoint: '/account/me',
  },
  ADMIN: {
    role: 'ADMIN',
    cookiePath: '/admin/auth',
    refreshPath: '/admin/auth/refresh',
    profileEndpoint: '/admin/account/me',
  },
};

export interface PipelineContext {
  input: Record<string, unknown>;
  portal: PortalConfig;
  device?: DeviceInfo;
  res?: import('express').Response;

  accountId?: string;
  roles?: string[];
  tokenVersion?: number;
  email?: string;
  phone?: string;
  passwordHash?: string;
  verificationId?: string;
  verificationType?: 'EMAIL' | 'PHONE';
  verificationTarget?: string;

  credential?: {
    accountId: string;
    email: string;
    phone?: string;
    passwordHash: string;
    failedLoginCount: number;
    lockedUntil: Date | null;
    account: {
      currentState: string;
      tokenVersion: number;
      roles: Array<{ role: { code: string } }>;
    };
  };

  session?: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  };

  capabilities?: CapabilitySnapshot;
}

export type StepFunction = (ctx: PipelineContext) => Promise<PipelineContext>;

export interface PipelineError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export class PipelineAbortError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'PipelineAbortError';
  }
}
