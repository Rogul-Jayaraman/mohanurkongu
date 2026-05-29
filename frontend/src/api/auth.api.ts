import api from '../lib/api';

export interface SendRegistrationOtpDto {
  email: string;
}

export interface VerifyRegistrationOtpDto {
  email: string;
  otp: string;
}

export interface SignupDto {
  verificationToken: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  phone?: string;
  password: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface ResetPasswordDto {
  email: string;
  resetToken: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface BackendAccount {
  accountNo: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  email: string;
  phone: string;
  membership: {
    planCode: string;
    expiresAt: string | null;
  } | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  sessionId: string;
}

export function sendRegistrationOtp(dto: SendRegistrationOtpDto): Promise<null> {
  return api.post('/auth/registration/otp', dto);
}

export function verifyRegistrationOtp(dto: VerifyRegistrationOtpDto): Promise<{ verificationToken: string }> {
  return api.post('/auth/registration/otp/verify', dto);
}

export function register(dto: SignupDto): Promise<LoginResponse> {
  return api.post('/auth/register', dto);
}

export function login(dto: LoginDto): Promise<LoginResponse> {
  return api.post('/auth/login', dto);
}

export function refresh(): Promise<{ accessToken: string }> {
  return api.post('/auth/refresh');
}

export function logout(): Promise<null> {
  return api.post('/auth/logout');
}

export function logoutAll(): Promise<null> {
  return api.post('/auth/logout-all');
}

export function sendPasswordResetOtp(dto: SendRegistrationOtpDto): Promise<null> {
  return api.post('/auth/password/otp', dto);
}

export function verifyPasswordResetOtp(dto: VerifyRegistrationOtpDto): Promise<{ resetToken: string }> {
  return api.post('/auth/password/otp/verify', dto);
}

export function resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
  return api.post('/auth/password/reset', dto);
}

export function getProfile(): Promise<BackendAccount> {
  return api.get('/account/me');
}

export function changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
  return api.post('/auth/change-password', dto);
}
