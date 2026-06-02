import { toast } from 'sonner';
import { AppError, isAppError } from '../lib/errors';

const PENDING_KEY = '__pendingMutations__';

interface PendingMutation {
  id: string;
  startedAt: number;
  label: string;
}

const pendingMap = new Map<string, PendingMutation>();

export function isPendingFor(resourceId: string): boolean {
  return pendingMap.has(resourceId);
}

export function registerPending(resourceId: string, label: string): void {
  pendingMap.set(resourceId, {
    id: resourceId,
    startedAt: Date.now(),
    label,
  });
}

export function clearPending(resourceId: string): void {
  pendingMap.delete(resourceId);
}

export function translateError(err: unknown): string {
  if (isAppError(err)) {
    return err.message || err.code;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export function showErrorToast(err: unknown, fallbackMessage?: string): void {
  const message = translateError(err);
  toast.error(message || fallbackMessage || 'Something went wrong');
}

export { AppError };
