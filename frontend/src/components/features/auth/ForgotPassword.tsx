import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useForgotPassword, useResetPassword } from '@/hooks/auth/useAuth';
import { Spinner as LoadingSpinner } from '@/components/ui/feedback/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    ForgotPasswordIdentifyForm,
    ForgotPasswordVerifyForm,
    ForgotPasswordResetForm
} from '@/components/forms/auth/ForgotPasswordForm';

type RecoveryStep = 'IDENTIFY' | 'VERIFY' | 'RESET' | 'SUCCESS';

const Header: React.FC<{ title: string; info: string }> = ({ title, info }) => (
    <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-rosewood-dark mb-2 tracking-tight">{title}</h2>
        <p className="text-stone-500 font-medium text-sm lg:text-base">{info}</p>
    </div>
);

/**
 * IdentifyStep – header + identify form.
 */
export const ForgotPasswordIdentifyStep: React.FC<{
    email: string;
    isPending: boolean;
    onEmailChange: (email: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}> = ({ email, isPending, onEmailChange, onSubmit }) => {
    const { t } = useLanguage();
    return (
        <>
            <Header title={t('forgot.step1.title')} info={t('forgot.step1.info')} />
            <ForgotPasswordIdentifyForm
                label={t('forgot.step1.email')}
                placeholder={t('forgot.step1.emailPlaceholder')}
                buttonText={t('forgot.step1.submit')}
                value={email}
                isPending={isPending}
                onChange={onEmailChange}
                onSubmit={onSubmit}
            />
        </>
    );
};

/**
 * VerifyStep – header + verify form + timer/resend UI.
 */
export const ForgotPasswordVerifyStep: React.FC<{
    otp: string;
    timer: number;
    canResend: boolean;
    isPending: boolean;
    onOtpChange: (otp: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onResend: () => void;
}> = ({ otp, timer, canResend, isPending, onOtpChange, onSubmit, onResend }) => {
    const { t } = useLanguage();
    return (
        <>
            <Header title={t('forgot.step2.title')} info={t('forgot.step2.info')} />
            <ForgotPasswordVerifyForm
                label={t('forgot.step2.otp')}
                placeholder="XXXXXX"
                buttonText={t('forgot.step2.submit')}
                value={otp}
                onChange={onOtpChange}
                onSubmit={onSubmit}
            />
            <div className="flex items-center justify-between px-1">
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {t('forgot.step2.otpWarning')}
                </p>
                <button
                    type="button"
                    onClick={onResend}
                    disabled={!canResend || isPending}
                    className="text-[10px] font-bold text-rosewood hover:text-rosewood-dark transition-colors flex items-center gap-1 uppercase tracking-tighter disabled:opacity-50"
                >
                    {isPending ? <LoadingSpinner size="sm" color="rosewood" /> : (
                        <>
                            <span className="material-symbols-outlined text-[14px]">refresh</span>
                            {canResend ? t('signup.resend') : t('signup.resendIn', { time: `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` })}
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

/**
 * ResetStep – header + reset form + password strength.
 */
export const ForgotPasswordResetStep: React.FC<{
    password: string;
    confirmPassword: string;
    passwordError?: string;
    confirmPasswordError?: string;
    isPending: boolean;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}> = ({ password, confirmPassword, passwordError, confirmPasswordError, isPending, onPasswordChange, onConfirmPasswordChange, onSubmit }) => {
    const { t } = useLanguage();
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
                passwordError={passwordError}
                confirmPasswordError={confirmPasswordError}
                isPending={isPending}
                onPasswordChange={onPasswordChange}
                onConfirmPasswordChange={onConfirmPasswordChange}
                onSubmit={onSubmit}
            />
        </>
    );
};

/**
 * SuccessStep – confirmation screen.
 */
export const ForgotPasswordSuccessStep: React.FC<{
    onNavigateToLogin: () => void;
}> = ({ onNavigateToLogin }) => {
    const { t } = useLanguage();
    return (
        <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 text-green-600 rounded-full mb-8 shadow-inner border border-green-100">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-4 tracking-tight">{t('forgot.step3.success')}</h2>
            <p className="text-stone-500 mb-10 font-medium text-sm leading-relaxed">
                Your password has been securely updated. You can now login with your new credentials.
            </p>
            <button
                onClick={onNavigateToLogin}
                className="w-full py-4 bg-rosewood text-gold rounded-xl font-bold text-lg shadow-xl shadow-rosewood/20 hover:bg-rosewood-dark transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
                {t('forgot.step3.backToLogin')}
            </button>
        </div>
    );
};

/**
 * ForgotPasswordForm – orchestrates the multi-step forgot password flow.
 */
export const ForgotPasswordForm: React.FC = () => {
    const { t, translateError } = useLanguage();
    const forgotMutation = useForgotPassword();
    const resetMutation = useResetPassword();
    const navigate = useNavigate();

    const [step, setStep] = useState<RecoveryStep>('IDENTIFY');
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleIdentify = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        forgotMutation.mutate(email, {
            onSuccess: (res) => {
                if (res?.success) {
                    setStep('VERIFY');
                    setTimer(180);
                    setCanResend(false);
                    toast.success(t('signup.sent'));
                }
            },
            onError: (err: any) => {
                const apiError = err.response?.data;
                const translatedMsg = translateError(apiError?.message || 'Failed to send reset code', apiError?.code);
                setError(translatedMsg);
                toast.error(translatedMsg);
            }
        });
    };

    const handleResendOTP = () => {
        if (!canResend || forgotMutation.isPending) return;
        forgotMutation.mutate(email, {
            onSuccess: (res) => {
                if (res?.success) {
                    setTimer(180);
                    setCanResend(false);
                    toast.success(t('signup.sent'));
                }
            },
            onError: (err: any) => {
                const apiError = err.response?.data;
                toast.error(translateError(apiError?.message || 'Failed to resend code', apiError?.code));
            }
        });
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            const translatedMsg = translateError('errors.otpInvalid');
            setError(translatedMsg);
            toast.error(translatedMsg);
            return;
        }
        setStep('RESET');
        toast.success(t('common.verified'));
    };

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        setError(null);

        if (password !== confirmPassword) {
            const translatedMsg = translateError('errors.passwordMismatch', 'ERR_VALIDATION_002');
            setFieldErrors({ confirmPassword: translatedMsg });
            return;
        }

        const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password);
        if (!isStrong) {
            const translatedMsg = translateError('errors.passwordReqFill');
            setFieldErrors({ password: translatedMsg });
            return;
        }

        resetMutation.mutate({ email, otp, password }, {
            onSuccess: (res) => {
                if (res?.success) {
                    setStep('SUCCESS');
                    toast.success(t('forgot.step3.success'));
                }
            },
            onError: (err: any) => {
                const apiError = err.response?.data;
                const translatedMsg = translateError(apiError?.message || 'Failed to reset password', apiError?.code);
                setError(translatedMsg);
                toast.error(translatedMsg);
            }
        });
    };

    const renderStep = () => {
        switch (step) {
            case 'IDENTIFY':
                return (
                    <ForgotPasswordIdentifyStep
                        email={email}
                        isPending={forgotMutation.isPending}
                        onEmailChange={setEmail}
                        onSubmit={handleIdentify}
                    />
                );
            case 'VERIFY':
                return (
                    <ForgotPasswordVerifyStep
                        otp={otp}
                        timer={timer}
                        canResend={canResend}
                        isPending={forgotMutation.isPending}
                        onOtpChange={setOtp}
                        onSubmit={handleVerify}
                        onResend={handleResendOTP}
                    />
                );
            case 'RESET':
                return (
                    <ForgotPasswordResetStep
                        password={password}
                        confirmPassword={confirmPassword}
                        passwordError={fieldErrors.password}
                        confirmPasswordError={fieldErrors.confirmPassword}
                        isPending={resetMutation.isPending}
                        onPasswordChange={setPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSubmit={handleReset}
                    />
                );
            case 'SUCCESS':
                return <ForgotPasswordSuccessStep onNavigateToLogin={() => navigate('/manamaalai/login')} />;
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
            >
                {step !== 'SUCCESS' && (
                    <Link to="/manamaalai/login" className="inline-flex items-center gap-2 text-rosewood hover:text-rosewood-dark mb-8 font-semibold transition-colors group text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:-translate-x-1 transition-transform"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                        {t('forgot.step3.backToLogin')}
                    </Link>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-3"
                    >
                        <span className="mt-0.5 text-sm material-symbols-outlined">error</span>
                        <p className="text-xs font-bold leading-relaxed">{error}</p>
                    </motion.div>
                )}

                {renderStep()}
            </motion.div>
        </AnimatePresence>
    );
};

/**
 * ForgotPasswordFormWrapper – visual container for the multi-step forgot password flow.
 */
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
