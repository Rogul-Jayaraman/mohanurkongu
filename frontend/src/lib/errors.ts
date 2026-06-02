export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export interface ValidationDetail {
  field: string;
  message: string;
}

export function isValidationError(err: unknown): err is AppError & { details: ValidationDetail[] } {
  return isAppError(err) && err.code === 'VALIDATION_ERROR' && Array.isArray(err.details);
}

export function getFieldError(err: unknown, field: string): string | undefined {
  if (!isValidationError(err)) return undefined;
  return err.details.find((d) => d.field === field)?.message;
}

export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (isAppError(err)) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export type ErrorType = 'NOT_FOUND' | 'FORBIDDEN' | 'NETWORK_ERROR' | 'UNKNOWN' | null;

export function resolveErrorType(err: unknown): { type: ErrorType; message: string } {
  if (isAppError(err)) {
    switch (err.code) {
      case 'NOT_FOUND': return { type: 'NOT_FOUND', message: err.message };
      case 'FORBIDDEN':
      case 'UNAUTHORIZED': return { type: 'FORBIDDEN', message: err.message };
      case 'NETWORK_ERROR':
      case 'INTERNAL_ERROR': return { type: 'NETWORK_ERROR', message: err.message };
      default: return { type: 'UNKNOWN', message: err.message };
    }
  }

  const status = (err as any)?.status ?? (err as any)?.response?.status;
  const message = (err as any)?.message ?? (err as any)?.statusText ?? 'An unexpected error occurred';

  if (status === 404) return { type: 'NOT_FOUND', message: 'This profile does not exist or has been removed.' };
  if (status === 403) return { type: 'FORBIDDEN', message: 'You do not have permission to view this profile.' };
  if (status === 401) return { type: 'FORBIDDEN', message: 'Please sign in to view this profile.' };

  if (err instanceof TypeError && (err.message === 'Failed to fetch' || err.message === 'NetworkError')) {
    return { type: 'NETWORK_ERROR', message: 'Unable to connect. Please check your connection.' };
  }

  return { type: 'UNKNOWN', message };
}
