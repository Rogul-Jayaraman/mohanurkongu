export type NextStep = 'VERIFY_OTP' | 'SIGNUP' | 'LOGIN' | 'HOME' | 'RESET_PASSWORD';

const STEP_ROUTES: Record<string, string> = {
  VERIFY_OTP: '/manamaalai/signup',
  SIGNUP: '/manamaalai/signup',
  LOGIN: '/manamaalai/login',
  HOME: '/manamaalai/dashboard',
  RESET_PASSWORD: '/manamaalai/forgot-password',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_HOME: '/admin/dashboard',
};

export function mapNextStep(nextStep?: string | null): string | null {
  if (!nextStep) return null;
  return STEP_ROUTES[nextStep] ?? null;
}

export function getDefaultRedirect(role: 'USER' | 'ADMIN'): string {
  return role === 'ADMIN' ? '/admin/dashboard' : '/manamaalai/dashboard';
}
