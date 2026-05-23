import api from '../lib/api';

// ─── DTO Types ─────────────────────────────────────────

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
  email: string;
  phone?: string;
  password: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
  portal?: 'USER' | 'ADMIN';
}

export interface ForgotPasswordOtpDto {
  email: string;
}

export interface VerifyResetOtpDto {
  email: string;
  otp: string;
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
  id: string;
  accountNo: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  membership: {
    planCode: string;
    planName: string;
    status: string;
    expiresAt: string;
    currency: string;
    price: number;
  } | null;
  currentState: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  account: BackendAccount;
}

export interface VerifyOtpResponse {
  verificationToken: string;
}

export interface VerifyResetOtpResponse {
  resetToken: string;
}

export interface MessageResponse {
  message: string;
}

export async function sendRegistrationOtp(dto: SendRegistrationOtpDto): Promise<null> {
  return api.post('/auth/registration/otp', dto);
}

export async function verifyRegistrationOtp(dto: VerifyRegistrationOtpDto): Promise<VerifyOtpResponse> {
  return api.post('/auth/registration/otp/verify', dto);
}

export async function signup(dto: SignupDto): Promise<MessageResponse> {
  return api.post('/auth/signup', dto);
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
  return api.post('/auth/login', dto);
}

export async function refresh(): Promise<{ accessToken: string }> {
  return api.post('/auth/refresh');
}

export async function logout(): Promise<null> {
  return api.post('/auth/logout');
}

export async function logoutAll(): Promise<null> {
  return api.post('/auth/logout-all');
}

export async function sendPasswordResetOtp(dto: ForgotPasswordOtpDto): Promise<null> {
  return api.post('/auth/password/otp', dto);
}

export async function verifyPasswordResetOtp(dto: VerifyResetOtpDto): Promise<VerifyResetOtpResponse> {
  return api.post('/auth/password/otp/verify', dto);
}

export async function resetPassword(dto: ResetPasswordDto): Promise<MessageResponse> {
  return api.post('/auth/password/reset', dto);
}

export async function getProfile(): Promise<BackendAccount> {
  return api.get('/auth/me');
}

export async function changePassword(dto: ChangePasswordDto): Promise<MessageResponse> {
  return api.post('/auth/change-password', dto);
}
