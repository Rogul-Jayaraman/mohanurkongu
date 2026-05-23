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
