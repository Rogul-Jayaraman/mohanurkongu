export interface LoginData {
  identifier: string;
  password: string;
}

export interface SignupData {
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

const nameRegex = /^[A-Za-z\s'.\-]+$/u;

export function validateName(name: string): boolean {
  return nameRegex.test(name.trim());
}

export function validateLogin(data: LoginData) {
  const errors: Record<string, string> = {};
  if (!data.identifier?.trim()) errors.identifier = 'VALIDATION_REQUIRED';
  if (!data.password) errors.password = 'VALIDATION_REQUIRED';
  return errors;
}

export function validateSignupStep(step: number, data: SignupData) {
  const errors: Record<string, string> = {};

  if (step === 1) {
    if (!data.firstNameEn?.trim()) errors.firstNameEn = 'VALIDATION_REQUIRED';
    else if (!validateName(data.firstNameEn)) errors.firstNameEn = 'VALIDATION_NAME_INVALID';

    if (!data.lastNameEn?.trim()) errors.lastNameEn = 'VALIDATION_REQUIRED';
    if (!data.firstNameTa?.trim()) errors.firstNameTa = 'VALIDATION_REQUIRED';
    if (!data.lastNameTa?.trim()) errors.lastNameTa = 'VALIDATION_REQUIRED';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'VALIDATION_INVALID_EMAIL';
    if (data.phone && !/^\+[\d\s-]+$/.test(data.phone)) errors.phone = 'VALIDATION_INVALID_PHONE';
    if (!data.password || data.password.length < 8) errors.password = 'VALIDATION_PASSWORD_WEAK';
    if (data.password !== data.confirmPassword) errors.confirmPassword = 'VALIDATION_PASSWORD_MISMATCH';
    if (!data.termsAccepted) errors.termsAccepted = 'VALIDATION_REQUIRED';
  }

  return errors;
}


