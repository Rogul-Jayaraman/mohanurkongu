export type EmailTemplate = 'welcome' | 'password-reset' | 'password-reset-otp' | 'registration-otp';

export interface BaseEmailData {
  to: string;
}

export interface WelcomeEmailData extends BaseEmailData {
  name: string;
  profileUrl: string;
  exploreUrl: string;
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

export type TemplateDataMap = {
  welcome: WelcomeEmailData;
  'password-reset': PasswordResetEmailData;
  'password-reset-otp': PasswordResetOtpEmailData;
  'registration-otp': RegistrationOtpEmailData;
};

export interface TemplateEmailJob<T extends EmailTemplate = EmailTemplate> {
  template: T;
  data: TemplateDataMap[T];
  createdAt: string;
}
