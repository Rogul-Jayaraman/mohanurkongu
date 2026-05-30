import { enqueueTemplateEmail } from './email.queue.js';

export class NotificationService {
  async sendRegistrationOtpEmail(to: string, otp: string): Promise<void> {
    await enqueueTemplateEmail('registration-otp', {
      to,
      otpCode: otp,
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
}
