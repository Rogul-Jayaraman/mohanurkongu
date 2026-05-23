import { AppError, isAppError, isValidationError } from '../lib/errors';
import type { ValidationDetail } from '../lib/errors';

export type ErrorSeverity = 'field' | 'form' | 'banner' | 'modal' | 'toast';

export interface DisplayError {
  message: string;
  severity: ErrorSeverity;
  code: string;
  fieldErrors?: Record<string, string>;
}

function getErrorSeverity(code: string): ErrorSeverity {
  if (code === 'VALIDATION_ERROR') return 'field';
  if (code.startsWith('AUTH_')) return 'form';
  if (code === 'RATE_LIMIT_EXCEEDED') return 'banner';
  if (code === 'REQUEST_TIMEOUT') return 'banner';
  if (code === 'NETWORK_ERROR') return 'banner';
  if (code.startsWith('INTERNAL_')) return 'modal';
  return 'toast';
}

export function toDisplayError(err: unknown, fallback = 'An unexpected error occurred'): DisplayError {
  if (isAppError(err)) {
    const display: DisplayError = {
      message: err.message || fallback,
      severity: getErrorSeverity(err.code),
      code: err.code,
    };

    if (isValidationError(err)) {
      display.fieldErrors = Object.fromEntries(
        (err.details as ValidationDetail[]).map((d) => [d.field, d.message]),
      );
    }

    return display;
  }

  if (err instanceof Error) {
    return {
      message: err.message || fallback,
      severity: 'modal',
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: fallback,
    severity: 'modal',
    code: 'UNKNOWN_ERROR',
  };
}

export function getFieldErrors(err: unknown): Record<string, string> {
  if (isValidationError(err)) {
    return Object.fromEntries(
      (err.details as ValidationDetail[]).map((d) => [d.field, d.message]),
    );
  }
  return {};
}
