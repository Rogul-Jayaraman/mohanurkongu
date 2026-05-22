import { EventEmitter } from 'events';
import * as emailService from './email';

interface EmailJob {
  type: 'OTP' | 'WELCOME' | 'RESET_PASSWORD';
  to: string;
  data: { otp?: string; name?: string };
  retries: number;
}

class EmailQueue extends EventEmitter {
  private queue: EmailJob[] = [];
  private processing = false;
  private maxRetries = 2;

  enqueue(job: Omit<EmailJob, 'retries'>): void {
    this.queue.push({ ...job, retries: 0 });
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      try {
        await this.dispatch(job);
        this.emit('sent', { type: job.type, to: job.to });
      } catch (err: any) {
        if (job.retries < this.maxRetries) {
          this.queue.push({ ...job, retries: job.retries + 1 });
          this.emit('retry', { type: job.type, to: job.to, attempt: job.retries + 1, error: err.message });
        } else {
          this.emit('failed', { type: job.type, to: job.to, error: err.message });
        }
      }
    }

    this.processing = false;
  }

  private async dispatch(job: EmailJob): Promise<void> {
    switch (job.type) {
      case 'OTP':
        await emailService.sendOTP(job.to, job.data.otp!);
        break;
      case 'WELCOME':
        await emailService.sendWelcomeEmail(job.to, job.data.name!);
        break;
      case 'RESET_PASSWORD':
        await emailService.sendResetPasswordOTP(job.to, job.data.otp!);
        break;
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

export const emailQueue = new EmailQueue();
