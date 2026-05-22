import { Router } from 'express';
import { signup, login, adminLogin, verifyOtp, forgotPassword, resetPassword, sendOtp, sendRegistrationOtp, verifyRegistrationOtp } from '../controllers/auth';
import { otpSendLimiter, otpVerifyLimiter, signupLimiter } from '../middlewares/rate-limiter';

const router = Router();

// Registration flow (optimized, rate-limited)
router.post('/send-registration-otp', otpSendLimiter, (req, res, next) => sendRegistrationOtp(req, res).catch(next));
router.post('/verify-registration-otp', otpVerifyLimiter, (req, res, next) => verifyRegistrationOtp(req, res).catch(next));
router.post('/signup', signupLimiter, (req, res, next) => signup(req, res).catch(next));

// Legacy endpoints
router.post('/login', (req, res, next) => login(req, res).catch(next));
router.post('/admin-login', (req, res, next) => adminLogin(req, res).catch(next));
router.post('/verify-otp', (req, res, next) => verifyOtp(req, res).catch(next));
router.post('/forgot-password', (req, res, next) => forgotPassword(req, res).catch(next));
router.post('/reset-password', (req, res, next) => resetPassword(req, res).catch(next));
router.post('/send-otp', (req, res, next) => sendOtp(req, res).catch(next));

export default router;
