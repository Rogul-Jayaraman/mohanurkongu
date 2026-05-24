import { enqueueTemplateEmail } from './email.queue.js';

export class NotificationService {
  async sendRegistrationOtpEmail(to: string, otp: string): Promise<void> {
    await enqueueTemplateEmail('registration-otp', {
      to,
      otpCode: otp,
      unsubscribeUrl: '',
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await enqueueTemplateEmail('login-otp', {
      to,
      otpCode: otp,
      unsubscribeUrl: '',
    });
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await enqueueTemplateEmail('email-verification', {
      to,
      verifyUrl,
      unsubscribeUrl: '',
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await enqueueTemplateEmail('password-reset', {
      to,
      resetUrl,
      unsubscribeUrl: '',
    });
  }

  async sendPasswordResetOtpEmail(to: string, otp: string): Promise<void> {
    await enqueueTemplateEmail('password-reset-otp', {
      to,
      otpCode: otp,
      unsubscribeUrl: '',
    });
  }

  async sendWelcomeEmail(to: string, name: string, profileUrl: string): Promise<void> {
    await enqueueTemplateEmail('welcome', {
      to,
      name,
      profileUrl,
      exploreUrl: '',
      unsubscribeUrl: '',
    });
  }

  async sendSecurityAlert(
    to: string,
    deviceTime: string,
    deviceName: string,
    deviceLocation: string,
    reviewUrl: string,
    secureUrl: string,
  ): Promise<void> {
    await enqueueTemplateEmail('security-alert', {
      to,
      deviceTime,
      deviceName,
      deviceLocation,
      reviewUrl,
      secureUrl,
      unsubscribeUrl: '',
    });
  }
}
