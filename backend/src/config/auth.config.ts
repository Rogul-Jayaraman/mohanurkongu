function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Application startup aborted.`);
  }
  return value;
}

export const authConfig = {
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    verificationSecret: requireEnv('JWT_VERIFICATION_SECRET'),
    resetSecret: requireEnv('JWT_RESET_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    verificationExpiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN || '15m',
    resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '15m',
  },
  argon2: {
    memory: parseInt(process.env.ARGON2_MEMORY || '65536', 10),
    iterations: parseInt(process.env.ARGON2_ITERATIONS || '3', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
    hashLength: parseInt(process.env.ARGON2_HASH_LENGTH || '32', 10),
  },
  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    cooldownSeconds: parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10),
    maxResends: parseInt(process.env.OTP_MAX_RESENDS || '3', 10),
    resendWindowMinutes: parseInt(process.env.OTP_RESEND_WINDOW_MINUTES || '5', 10),
    maxAttempts: 5,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    globalMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    otpMax: parseInt(process.env.OTP_RATE_LIMIT_MAX || '3', 10),
    otpVerifyMax: parseInt(process.env.OTP_VERIFY_RATE_LIMIT_MAX || '5', 10),
    signupMax: parseInt(process.env.SIGNUP_RATE_LIMIT_MAX || '5', 10),
    refreshMax: parseInt(process.env.REFRESH_RATE_LIMIT_MAX || '10', 10),
  },
  session: {
    cleanupIntervalMinutes: parseInt(process.env.SESSION_CLEANUP_INTERVAL_MINUTES || '15', 10),
    maxActive: parseInt(process.env.SESSION_MAX_ACTIVE || '5', 10),
  },
  jobs: {
    expireIntervalMs: parseInt(process.env.VERIFICATION_EXPIRE_INTERVAL_MS || '60000', 10),
    archiveIntervalMs: parseInt(process.env.VERIFICATION_ARCHIVE_INTERVAL_MS || '86400000', 10),
    purgeIntervalMs: parseInt(process.env.VERIFICATION_PURGE_INTERVAL_MS || '604800000', 10),
    archiveAfterDays: parseInt(process.env.VERIFICATION_ARCHIVE_AFTER_DAYS || '30', 10),
    purgeAfterDays: parseInt(process.env.VERIFICATION_PURGE_AFTER_DAYS || '90', 10),
  },
};
