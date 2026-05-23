import { AppError } from '../lib/errors';

export type NextStep = 'VERIFY_OTP' | 'SIGNUP' | 'LOGIN' | 'HOME' | 'RESET_PASSWORD';

export interface BackendMeta {
  nextStep?: NextStep;
  [key: string]: unknown;
}

export interface BackendSuccess<T> {
  success: true;
  data: T;
  meta?: BackendMeta;
  requestId?: string;
}

export interface BackendErrorBody {
  success: false;
  error: { code: string; message: string; details?: unknown };
  meta?: BackendMeta;
  requestId?: string;
}

export type BackendResponse<T> = BackendSuccess<T> | BackendErrorBody;

export interface UnwrappedResponse<T> {
  data: T;
  nextStep?: NextStep | null;
  requestId?: string;
}

export function isBackendSuccess<T>(body: unknown): body is BackendSuccess<T> {
  return typeof body === 'object' && body !== null && 'success' in body && (body as Record<string, unknown>).success === true;
}

export function isBackendError(body: unknown): body is BackendErrorBody {
  return typeof body === 'object' && body !== null && 'success' in body && (body as Record<string, unknown>).success === false;
}

export function unwrapResponse<T>(body: BackendResponse<T>): UnwrappedResponse<T> {
  if (body.success) {
    return {
      data: body.data,
      nextStep: body.meta?.nextStep,
      requestId: body.requestId,
    };
  }

  throw new AppError(
    0,
    body.error.code,
    body.error.message,
    body.error.details,
  );
}
