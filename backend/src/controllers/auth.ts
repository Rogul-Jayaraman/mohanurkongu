import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import * as authService from '../services/auth';
import * as emailService from '../services/email';
import * as verificationService from '../services/verification.service';
import { otpStore } from '../services/otp-store.service';
import { emailQueue } from '../services/email-queue.service';
import { ErrorCode, sendError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  sendOtpSchema,
} from '../utils/validators/auth';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your_jwt_secret') {
    console.error('CRITICAL: JWT_SECRET not set or using default value');
  }
  return secret || 'change_me_in_production';
})();

// ─────────────────────────────────────────────
// OPTIMIZED ENDPOINTS (minimal payload, background email)
// ─────────────────────────────────────────────

const err = (code: string, message?: string) => ({ success: false as const, error: { code, message } });

export const sendRegistrationOtp = async (req: Request, res: Response) => {
  try {
    const { email } = sendOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existingUser = await authService.findUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(400).json(err('ERR_AUTH_001'));
      return;
    }

    if (otpStore.isInCooldown(normalizedEmail)) {
      const remaining = Math.ceil(otpStore.cooldownRemaining(normalizedEmail) / 1000);
      res.status(429).json(err('ERR_AUTH_005', `Try again in ${remaining}s`));
      return;
    }

    if (!otpStore.canResend(normalizedEmail)) {
      res.status(429).json(err('ERR_RATE_LIMIT', 'Max OTP resends reached. Try again later.'));
      return;
    }

    const otp = otpStore.generateOtp();
    const hash = otpStore.hashOtp(otp);
    otpStore.setOtp(normalizedEmail, hash);

    emailQueue.enqueue({ type: 'OTP', to: normalizedEmail, data: { otp } });

    res.status(202).json({ success: true, data: { message: 'OTP sent' } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json(err('ERR_VALIDATION_001'));
      return;
    }
    console.error('[sendRegistrationOtp]', error);
    res.status(500).json(err('ERR_SERVER_001'));
  }
};

export const verifyRegistrationOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = sendOtpSchema.extend({
      otp: z.string().length(6).regex(/^\d+$/),
    }).parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const record = otpStore.getOtp(normalizedEmail);
    if (!record) {
      res.status(400).json(err('ERR_AUTH_004'));
      return;
    }

    if (otpStore.isOtpExpired(normalizedEmail)) {
      otpStore.deleteOtp(normalizedEmail);
      res.status(400).json(err('ERR_AUTH_004'));
      return;
    }

    if (otpStore.isBlocked(normalizedEmail)) {
      otpStore.deleteOtp(normalizedEmail);
      res.status(429).json(err('ERR_AUTH_004', 'Too many failed attempts.'));
      return;
    }

    if (!otpStore.verifyOtp(otp, record.hash)) {
      const attempts = otpStore.incrementAttempts(normalizedEmail);
      if (attempts >= 5) {
        otpStore.deleteOtp(normalizedEmail);
        res.status(429).json(err('ERR_AUTH_004', 'Too many failed attempts.'));
        return;
      }
      res.status(400).json(err('ERR_AUTH_004'));
      return;
    }

    const jti = `vt_${normalizedEmail}_${Date.now()}`;
    const verificationToken = jwt.sign(
      { email: normalizedEmail, jti, purpose: 'email_verification' },
      JWT_SECRET,
      { expiresIn: '10m', issuer: 'mohanurkongu' }
    );

    otpStore.deleteOtp(normalizedEmail);

    res.json({ success: true, data: { verified: true, verificationToken } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json(err('ERR_VALIDATION_001'));
      return;
    }
    console.error('[verifyRegistrationOtp]', error);
    res.status(500).json(err('ERR_SERVER_001'));
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { firstNameEn, lastNameEn, firstNameTa, lastNameTa, email, phone, password, verificationToken } = req.body;

    if (!verificationToken) {
      res.status(400).json(err('ERR_AUTH_004', 'Verification token required'));
      return;
    }

    let decoded: { email: string; jti: string; purpose: string };
    try {
      decoded = jwt.verify(verificationToken, JWT_SECRET) as typeof decoded;
    } catch {
      res.status(400).json(err('ERR_AUTH_004', 'Invalid or expired verification token'));
      return;
    }

    if (decoded.purpose !== 'email_verification') {
      res.status(400).json(err('ERR_AUTH_004'));
      return;
    }

    if (otpStore.isTokenBlacklisted(decoded.jti)) {
      res.status(400).json(err('ERR_AUTH_004', 'Verification token already used'));
      return;
    }

    const signupBody = signupSchema.parse({ firstNameEn, lastNameEn, firstNameTa, lastNameTa, email, phone, password });
    const normalizedEmail = signupBody.email.toLowerCase();

    if (normalizedEmail !== decoded.email) {
      res.status(400).json(err('ERR_AUTH_004', 'Email mismatch'));
      return;
    }

    const existingUser = await authService.findUserByEmailOrPhone(normalizedEmail, signupBody.phone);
    if (existingUser) {
      res.status(400).json(err('ERR_AUTH_001'));
      return;
    }

    const hashedPassword = await authService.hashPassword(signupBody.password);
    const customId = await authService.generateCustomId();

    const user = await prisma.user.create({
      data: {
        customId,
        firstNameEn: signupBody.firstNameEn,
        lastNameEn: signupBody.lastNameEn,
        firstNameTa: signupBody.firstNameTa,
        lastNameTa: signupBody.lastNameTa,
        email: normalizedEmail,
        phone: signupBody.phone,
        password: hashedPassword,
      },
      select: { id: true, customId: true },
    });

    otpStore.blacklistToken(decoded.jti);

    const authToken = authService.generateToken({ userId: user.id, role: 'USER' });

    const displayName = `${signupBody.firstNameEn} ${signupBody.lastNameEn}`.trim() || normalizedEmail;
    emailQueue.enqueue({ type: 'WELCOME', to: normalizedEmail, data: { name: displayName } });

    res.status(201).json({ success: true, data: { userId: user.id, token: authToken } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json(err('ERR_VALIDATION_001'));
      return;
    }
    console.error('[signup]', error);
    res.status(500).json(err('ERR_SERVER_001'));
  }
};

// ─────────────────────────────────────────────
// LEGACY ENDPOINTS (unchanged for backward compat)
// ─────────────────────────────────────────────

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    let account: any = await authService.findUserByEmail(email);
    let isUser = true;
    if (!account) {
      account = await authService.findAdminByEmail(email);
      isUser = false;
    }
    if (!account || account.otp !== otp || (account.otpExpiry && account.otpExpiry < new Date())) {
      return sendError(res, ErrorCode.ERR_AUTH_004);
    }
    if (isUser) {
      await authService.updateUserOtp(account.id, null, null);
    } else {
      await authService.updateAdminOtp(account.id, null, null);
    }
    if (isUser) {
      const displayName = [account.firstNameEn, account.lastNameEn].filter(Boolean).join(' ') || account.email;
      try {
        await emailService.sendWelcomeEmail(account.email, displayName);
      } catch (err) {
        console.error('Failed to send welcome email:', err);
      }
    }
    const role = isUser ? 'USER' : 'ADMIN';
    const token = authService.generateToken({ userId: account.id, role });
    return sendSuccess(res, {
      token,
      user: {
        id: account.id, customId: account.customId,
        firstNameEn: account.firstNameEn, lastNameEn: account.lastNameEn,
        firstNameTa: account.firstNameTa, lastNameTa: account.lastNameTa,
        email: account.email, phone: account.phone,
        role: role,
        ...(isUser ? { plan: account.plan, planExpiry: account.planExpiry } : {})
      }
    }, 200);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, ErrorCode.ERR_VALIDATION_001);
    }
    console.error('OTP verification error:', error);
    sendError(res, ErrorCode.ERR_SERVER_001);
  }
};

const performLogin = async (req: Request, res: Response, targetPortal: 'USER' | 'ADMIN') => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    let account: any = null;
    let isUserTable = true;
    let finalRole: string = 'USER';
    const userAccount = await authService.findUserByIdentifier(identifier);
    const adminAccount = await authService.findAdminByIdentifier(identifier);
    if (targetPortal === 'USER') {
      if (userAccount && userAccount.role === 'USER') {
        account = userAccount; isUserTable = true; finalRole = 'USER';
      } else if ((userAccount && userAccount.role !== 'USER') || adminAccount) {
        return sendError(res, ErrorCode.ERR_AUTH_007, 'Please use the Admin login portal');
      }
    } else if (targetPortal === 'ADMIN') {
      if (adminAccount) {
        account = adminAccount; isUserTable = false; finalRole = 'ADMIN';
      } else if (userAccount && userAccount.role !== 'USER') {
        account = userAccount; isUserTable = true; finalRole = userAccount.role;
      } else if (userAccount && userAccount.role === 'USER') {
        return sendError(res, ErrorCode.ERR_AUTH_007, 'Please use the User login portal');
      }
    }
    if (!account || !(await authService.verifyPassword(password, account.password))) {
      return sendError(res, ErrorCode.ERR_AUTH_002);
    }
    const token = authService.generateToken({ userId: account.id, role: finalRole });
    return sendSuccess(res, {
      token,
      user: {
        id: account.id, customId: account.customId || null,
        firstNameEn: account.firstNameEn, lastNameEn: account.lastNameEn,
        firstNameTa: account.firstNameTa, lastNameTa: account.lastNameTa,
        email: account.email, phone: account.phone,
        role: finalRole,
        ...(isUserTable ? { plan: account.plan, planExpiry: account.planExpiry } : {})
      }
    }, 200);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, ErrorCode.ERR_VALIDATION_001);
    }
    console.error(`[AUTH] ${targetPortal} Login error:`, error);
    sendError(res, ErrorCode.ERR_SERVER_001);
  }
};

export const login = async (req: Request, res: Response) => {
  return performLogin(req, res, 'USER');
};

export const adminLogin = async (req: Request, res: Response) => {
  return performLogin(req, res, 'ADMIN');
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    let account: any = await authService.findUserByEmail(email);
    let isUser = true;
    if (!account) {
      account = await authService.findAdminByEmail(email);
      isUser = false;
    }
    if (!account) {
      const verification = await verificationService.findVerification(email, 'EMAIL');
      if (verification) {
        return sendError(res, ErrorCode.ERR_AUTH_006);
      }
      return sendError(res, ErrorCode.ERR_AUTH_003);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3 * 60 * 1000);
    if (account.otpExpiry) {
      const sentAt = new Date(account.otpExpiry.getTime() - 3 * 60 * 1000);
      if (sentAt > new Date(Date.now() - 1 * 60 * 1000)) {
        return sendError(res, ErrorCode.ERR_AUTH_005);
      }
    }
    if (isUser) {
      await authService.updateUserOtp(account.id, otp, expiry);
    } else {
      await authService.updateAdminOtp(account.id, otp, expiry);
    }
    try {
      await emailService.sendResetPasswordOTP(email, otp);
    } catch (emailError) {
      console.error('Failed to send reset password OTP:', emailError);
      return sendError(res, ErrorCode.ERR_AUTH_005);
    }
    return sendSuccess(res, null, 200);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, ErrorCode.ERR_VALIDATION_001);
    }
    console.error('Forgot password error:', error);
    sendError(res, ErrorCode.ERR_SERVER_001);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = resetPasswordSchema.parse(req.body);
    let account: any = await authService.findUserByEmail(email);
    let isUser = true;
    if (!account) {
      account = await authService.findAdminByEmail(email);
      isUser = false;
    }
    if (!account) {
      const verification = await verificationService.findVerification(email, 'EMAIL');
      if (verification) {
        return sendError(res, ErrorCode.ERR_AUTH_006);
      }
      return sendError(res, ErrorCode.ERR_AUTH_004);
    }
    if (account.otp !== otp || (account.otpExpiry && account.otpExpiry < new Date())) {
      return sendError(res, ErrorCode.ERR_AUTH_004);
    }
    const hashedPassword = await authService.hashPassword(password);
    if (isUser) {
      await authService.updateUserPassword(account.id, hashedPassword);
    } else {
      await authService.updateAdminPassword(account.id, hashedPassword);
    }
    return sendSuccess(res, null, 200);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, ErrorCode.ERR_VALIDATION_001);
    }
    console.error('Reset password error:', error);
    sendError(res, ErrorCode.ERR_SERVER_001);
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = sendOtpSchema.parse(req.body);
    let account: any = await authService.findUserByEmail(email);
    let isUser = true;
    if (!account) {
      account = await authService.findAdminByEmail(email);
      isUser = false;
    }
    if (!account) {
      return sendError(res, ErrorCode.ERR_AUTH_003);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3 * 60 * 1000);
    if (isUser) {
      await authService.updateUserOtp(account.id, otp, expiry);
    } else {
      await authService.updateAdminOtp(account.id, otp, expiry);
    }
    try {
      await emailService.sendOTP(email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return sendError(res, ErrorCode.ERR_AUTH_005);
    }
    return sendSuccess(res, { email }, 200);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, ErrorCode.ERR_VALIDATION_001);
    }
    console.error('Send OTP error:', error);
    sendError(res, ErrorCode.ERR_SERVER_001);
  }
};
