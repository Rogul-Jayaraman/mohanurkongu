import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle, X, Mail } from 'lucide-react';
import { OTPInput } from '@/components/ui/forms/OTPInput';

interface OtpVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
    otp: string;
    error?: string;
    verifyIsPending: boolean;
    sendIsPending: boolean;
    otpBtnText: string;
    verifyingText: string;
    otpVerifySuccessText: string;
    otpInfoText: string;
    resendTimer: number;
    isOTPVerified: boolean;
    onOTPChange: (value: string) => void;
    onVerify: () => void;
    onResend: () => void;
}

const maskEmail = (e: string) => {
    try {
        const [local, domain] = e.split('@');
        if (!domain) return e;
        if (local.length <= 2) return `${local[0]}***@${domain}`;
        return `${local[0]}${'*'.repeat(Math.max(2, local.length - 2))}${local.slice(-1)}@${domain}`;
    } catch {
        return e;
    }
};

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
    isOpen,
    onClose,
    email,
    otp,
    error,
    verifyIsPending,
    sendIsPending,
    otpBtnText,
    verifyingText,
    otpVerifySuccessText,
    otpInfoText,
    resendTimer,
    isOTPVerified,
    onOTPChange,
    onVerify,
    onResend,
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-5 sm:px-6 sm:py-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="otp-modal-title"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 24 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative w-full max-w-[min(100vw-1rem,480px)] bg-ivory border border-gold/25 rounded-[32px] shadow-2xl shadow-rosewood/20 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative px-6 pt-6 pb-4  border-b border-gold/10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-rosewood/10 text-rosewood">
                                        <ShieldCheck size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 id="otp-modal-title" className="text-lg font-bold text-rosewood leading-tight truncate">
                                            {otpBtnText}
                                        </h2>
                                        <p className="mt-0.5 text-sm text-rosewood/60 leading-snug">
                                            {otpInfoText}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="shrink-0 rounded-full bg-rosewood/5 p-2 text-rosewood/60 transition hover:bg-rosewood/10 hover:text-rosewood"
                                    aria-label="Close verification dialog"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 pb-4">
                            <AnimatePresence mode="wait">
                                {!isOTPVerified ? (
                                    <motion.div
                                        key="verify"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5 pt-5"
                                    >
                                        <div className="flex items-center justify-center gap-2 text-sm text-rosewood/60">
                                            <Mail size={14} className="shrink-0" />
                                            <span>
                                                Code sent to{' '}
                                                <span className="font-semibold text-rosewood">{maskEmail(email)}</span>
                                            </span>
                                        </div>

                                        <div className="py-4">
                                            <OTPInput
                                                value={otp}
                                                onChange={onOTPChange}
                                                error={error}
                                                onResend={onResend}
                                                resendTimer={resendTimer}
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col items-center justify-center gap-4 py-8"
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -90 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                                            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                                        >
                                            <CheckCircle size={40} />
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3, duration: 0.3 }}
                                            className="space-y-1 text-center"
                                        >
                                            <p className="text-lg font-bold text-rosewood">{otpVerifySuccessText}</p>
                                            <p className="text-sm text-rosewood/60">You can now continue with your account.</p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="border-t border-gold/10 px-6 py-4">
                            <AnimatePresence mode="wait">
                                {!isOTPVerified ? (
                                    <motion.div
                                        key="verify-actions"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid gap-3 sm:grid-cols-2"
                                    >
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={verifyIsPending}
                                            className="w-full rounded-2xl border border-gold/20 bg-white py-3 text-sm font-bold text-rosewood transition hover:bg-ivory hover:shadow-sm disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onVerify}
                                            disabled={verifyIsPending || otp.length !== 6}
                                            className="w-full rounded-2xl bg-rosewood py-3 text-sm font-bold text-white transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {verifyIsPending ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                    <span>{verifyingText}</span>
                                                </>
                                            ) : (
                                                <span>{otpBtnText}</span>
                                            )}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success-actions"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="w-full rounded-2xl bg-rosewood py-3 text-sm font-bold text-white transition hover:shadow-lg"
                                        >
                                            Continue
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
