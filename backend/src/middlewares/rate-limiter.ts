import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: { code: 'ERR_RATE_LIMIT', message: 'Too many requests. Please try again later.' } },
});

export const otpSendLimiter = rateLimit({
  windowMs: 60_000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: { code: 'ERR_RATE_LIMIT', message: 'Too many OTP requests. Try again in 60 seconds.' } },
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: { code: 'ERR_RATE_LIMIT', message: 'Too many verification attempts.' } },
});

export const signupLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: { code: 'ERR_RATE_LIMIT', message: 'Too many signup attempts.' } },
});
