import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Spinner } from '@/components/ui/feedback/Spinner';
import { OTPInput } from '@/components/ui/forms/OTPInput';
import { StepIndicator } from '@/components/ui/forms/StepIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ForgotPasswordIdentifyForm,
  ForgotPasswordResetForm,
} from '@/components/forms/auth/ForgotPasswordForm';
import { isAppError } from '@/lib/errors';
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} from '@/queries/useAuthMutations';

type RecoveryStep = 'IDENTIFY' | 'VERIFY' | 'RESET' | 'SUCCESS';

const STEPS = [
  { label: 'Email', key: 'identify' },
  { label: 'Verify', key: 'verify' },
  { label: 'Reset', key: 'reset' },
  { label: 'Done', key: 'success' },
];

const stepIndex: Record<RecoveryStep, number> = {
  IDENTIFY: 0,
  VERIFY: 1,
  RESET: 2,
  SUCCESS: 3,
};

const Header: React.FC<{ title: string; info: string }> = ({ title, info }) => (
  <div className="mb-6">
    <h2 className="text-lg sm:text-xl font-serif font-bold text-rosewood-dark mb-1 tracking-tight">{title}</h2>
    <p className="text-stone-500 font-medium text-xs sm:text-sm">{info}</p>
  </div>
);

export const ForgotPasswordForm: React.FC = () => {
  const { t, translateError } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<RecoveryStep>('IDENTIFY');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const sendOtpMutation = useSendOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);
    try {
      await sendOtpMutation.mutateAsync({ email, kind: 'reset' });
      setTimer(60);
      setCanResend(false);
      setStep('VERIFY');
    } catch (err) {
      setError(isAppError(err) ? translateError(err, err.code) : translateError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isSending) return;
    setIsSending(true);
    setOtpError(null);
    try {
      await sendOtpMutation.mutateAsync({ email, kind: 'reset' });
      setTimer(60);
      setCanResend(false);
      toast.success(t('signup.sent'));
    } catch (err) {
      setOtpError(isAppError(err) ? translateError(err, err.code) : translateError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (otpValue: string) => {
    if (otpValue.length !== 6 || isVerifying) return;
    setIsVerifying(true);
    setOtpError(null);

    try {
      const result = await verifyOtpMutation.mutateAsync({ email, otp: otpValue, kind: 'reset' });
      setResetToken(result.resetToken ?? null);
      setStep('RESET');
    } catch (err) {
      if (isAppError(err) && err.code === 'AUTH_VERIFICATION_EXPIRED') {
        setOtpError(t('signup.codeExpired'));
        setCanResend(true);
      } else {
        setOtpError(isAppError(err) ? translateError(err, err.code) : translateError(err));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: t('errors.passwordMismatch') });
      return;
    }

    const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password);
    if (!isStrong) {
      setFieldErrors({ password: t('forgot.passwordReq') });
      return;
    }

    if (!resetToken) {
      setError(t('forgot.sessionExpired'));
      return;
    }

    setIsResetting(true);
    try {
      await resetPasswordMutation.mutateAsync({ email, resetToken, password });
      setStep('SUCCESS');
    } catch (err) {
      setError(isAppError(err) ? translateError(err, err.code) : translateError(err));
    } finally {
      setIsResetting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'IDENTIFY':
        return (
          <>
            <Header title={t('forgot.step1.title')} info={t('forgot.step1.info')} />
            <ForgotPasswordIdentifyForm
              label={t('forgot.step1.email')}
              placeholder={t('forgot.step1.emailPlaceholder')}
              buttonText={t('forgot.step1.submit')}
              value={email}
              error={error || undefined}
              isPending={isSending}
              onChange={setEmail}
              onSubmit={handleSendOtp}
            />
          </>
        );

      case 'VERIFY':
        return (
          <>
            <Header title={t('forgot.step2.title')} info={t('forgot.step2.info')} />
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">{t('signup.otpInfo')}</p>
                <p className="text-rosewood/50 text-xs font-medium">{email}</p>
              </div>
              <OTPInput
                value={otp}
                onChange={setOtp}
                error={otpError || undefined}
                isVerifying={isVerifying}
                onComplete={handleVerifyOtp}
                onResend={handleResendOtp}
                resendTimer={timer}
              />
              <div className="flex items-center px-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {t('forgot.step2.otpWarning')}
                </span>
              </div>
            </div>
          </>
        );

      case 'RESET':
        return (
          <>
            <Header title={t('forgot.step3.title')} info={t('forgot.step3.info')} />
            <ForgotPasswordResetForm
              passwordLabel={t('forgot.step3.password')}
              confirmPasswordLabel={t('forgot.step3.confirmPassword')}
              passwordPlaceholder="********"
              confirmPasswordPlaceholder="********"
              buttonText={t('forgot.step3.submit')}
              password={password}
              confirmPassword={confirmPassword}
              passwordError={fieldErrors.password || error || undefined}
              confirmPasswordError={fieldErrors.confirmPassword}
              isPending={isResetting}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={handleReset}
            />
          </>
        );

      case 'SUCCESS':
        return (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 text-green-600 rounded-full mb-8 shadow-inner border border-green-100">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 mb-2 tracking-tight">
              {t('forgot.step3.success')}
            </h2>
            <p className="text-stone-500 mb-8 font-medium text-xs sm:text-sm leading-relaxed">
              {t('forgot.successInfo')}
            </p>
            <button
              onClick={() => navigate('/manamaalai/login')}
              className="w-full py-4 bg-rosewood text-gold rounded-xl font-bold text-lg shadow-xl shadow-rosewood/20 hover:bg-rosewood-dark transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {t('forgot.step3.backToLogin')}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {step !== 'SUCCESS' && (
        <>
          <Link
            to="/manamaalai/login"
            className="inline-flex items-center gap-2 text-rosewood hover:text-rosewood-dark font-semibold transition-colors group text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            {t('forgot.step3.backToLogin')}
          </Link>

          <StepIndicator steps={STEPS} currentStep={stepIndex[step]} />
        </>
      )}

      {error && step !== 'RESET' && error !== fieldErrors.password && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-3"
        >
          <span className="mt-0.5 text-sm material-symbols-outlined">error</span>
          <p className="text-xs font-bold leading-relaxed">{error}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const ForgotPasswordFormWrapper: React.FC = () => {
  return (
    <section className="w-full h-full flex items-center justify-center p-6 lg:p-10 relative z-20">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
      <div className="absolute inset-0 kolam-watermark opacity-[0.02] pointer-events-none" />
    </section>
  );
};
