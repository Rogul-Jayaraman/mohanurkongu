import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 300_000;
const COOLDOWN_MS = 60_000;
const MAX_RESEND = 3;
const MAX_ATTEMPTS = 5;
const RESEND_WINDOW_MS = 300_000;
const CLEANUP_INTERVAL_MS = 60_000;

interface OtpRecord {
  hash: string;
  attempts: number;
  createdAt: number;
}

class OtpStore {
  private store = new Map<string, OtpRecord>();
  private blacklist = new Set<string>();
  private cooldown = new Map<string, number>();
  private resendCount = new Map<string, { count: number; windowStart: number }>();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  generateOtp(): string {
    const min = Math.pow(10, OTP_LENGTH - 1);
    const max = Math.pow(10, OTP_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  setOtp(email: string, hash: string): void {
    this.store.set(email.toLowerCase(), { hash, attempts: 0, createdAt: Date.now() });
    this.setCooldown(email);
  }

  getOtp(email: string): OtpRecord | undefined {
    return this.store.get(email.toLowerCase());
  }

  deleteOtp(email: string): void {
    this.store.delete(email.toLowerCase());
  }

  verifyOtp(otp: string, hash: string): boolean {
    const computed = this.hashOtp(otp);
    if (computed.length !== hash.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
    } catch {
      return false;
    }
  }

  incrementAttempts(email: string): number {
    const key = email.toLowerCase();
    const record = this.store.get(key);
    if (!record) return 0;
    record.attempts += 1;
    return record.attempts;
  }

  isBlocked(email: string): boolean {
    const record = this.store.get(email.toLowerCase());
    return record ? record.attempts >= MAX_ATTEMPTS : false;
  }

  isInCooldown(email: string): boolean {
    const until = this.cooldown.get(email.toLowerCase());
    return until ? Date.now() < until : false;
  }

  setCooldown(email: string): void {
    this.cooldown.set(email.toLowerCase(), Date.now() + COOLDOWN_MS);
  }

  cooldownRemaining(email: string): number {
    const until = this.cooldown.get(email.toLowerCase());
    if (!until) return 0;
    return Math.max(0, until - Date.now());
  }

  canResend(email: string): boolean {
    const key = email.toLowerCase();
    const entry = this.resendCount.get(key);
    const now = Date.now();
    if (!entry || now - entry.windowStart > RESEND_WINDOW_MS) {
      this.resendCount.set(key, { count: 1, windowStart: now });
      return true;
    }
    if (entry.count >= MAX_RESEND) return false;
    entry.count += 1;
    return true;
  }

  isTokenBlacklisted(jti: string): boolean {
    return this.blacklist.has(jti);
  }

  blacklistToken(jti: string): void {
    this.blacklist.add(jti);
  }

  isOtpExpired(email: string): boolean {
    const record = this.store.get(email.toLowerCase());
    return record ? Date.now() - record.createdAt > OTP_TTL_MS : true;
  }

  ttlRemaining(email: string): number {
    const record = this.store.get(email.toLowerCase());
    if (!record) return 0;
    return Math.max(0, OTP_TTL_MS - (Date.now() - record.createdAt));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store) {
      if (now - record.createdAt > OTP_TTL_MS) this.store.delete(key);
    }
    for (const [key, until] of this.cooldown) {
      if (now >= until) this.cooldown.delete(key);
    }
    for (const [key, entry] of this.resendCount) {
      if (now - entry.windowStart > RESEND_WINDOW_MS) this.resendCount.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.store.clear();
    this.blacklist.clear();
    this.cooldown.clear();
    this.resendCount.clear();
  }
}

export const otpStore = new OtpStore();
export { OTP_LENGTH, OTP_TTL_MS, COOLDOWN_MS, MAX_RESEND, MAX_ATTEMPTS };
