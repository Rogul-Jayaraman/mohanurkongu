export const AuthPolicy = {
  otp: {
    cooldownSeconds: 60,
    maxResendsPerWindow: 3,
    resendWindowMinutes: 5,
    maxAttempts: 5,
    expiryMinutes: 5,
  },
  session: {
    maxActive: 5,
    refreshExpiryDays: 7,
    accessExpiryMinutes: 15,
  },
  login: {
    maxFailedAttempts: 5,
    lockoutMinutes: 15,
    progressiveDelayStart: 3,
    progressiveDelayMs: 500,
  },
} as const;
