export type EmailTemplate = 'welcome' | 'email-verification' | 'login-otp' | 'password-reset' | 'security-alert' | 'password-reset-otp' | 'registration-otp';

export interface BaseEmailData {
  to: string;
}

export interface WelcomeEmailData extends BaseEmailData {
  name: string;
  profileUrl: string;
  exploreUrl: string;
  unsubscribeUrl: string;
}

export interface VerificationEmailData extends BaseEmailData {
  verifyUrl: string;
  unsubscribeUrl: string;
}

export interface LoginOtpEmailData extends BaseEmailData {
  otpCode: string;
  unsubscribeUrl: string;
}

export interface RegistrationOtpEmailData extends BaseEmailData {
  otpCode: string;
  unsubscribeUrl: string;
}

export interface PasswordResetEmailData extends BaseEmailData {
  resetUrl: string;
  unsubscribeUrl: string;
}

export interface PasswordResetOtpEmailData extends BaseEmailData {
  otpCode: string;
  unsubscribeUrl: string;
}

export interface SecurityAlertEmailData extends BaseEmailData {
  deviceTime: string;
  deviceName: string;
  deviceLocation: string;
  reviewUrl: string;
  secureUrl: string;
  unsubscribeUrl: string;
}

export type TemplateDataMap = {
  welcome: WelcomeEmailData;
  'email-verification': VerificationEmailData;
  'login-otp': LoginOtpEmailData;
  'password-reset': PasswordResetEmailData;
  'security-alert': SecurityAlertEmailData;
  'password-reset-otp': PasswordResetOtpEmailData;
  'registration-otp': RegistrationOtpEmailData;
};

export interface TemplateEmailJob<T extends EmailTemplate = EmailTemplate> {
  template: T;
  data: TemplateDataMap[T];
  createdAt: string;
}
