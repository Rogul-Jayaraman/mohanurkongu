import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { OTPInput } from '@/components/ui/forms/OTPInput';
import { useLanguage } from '@/context/LanguageContext';

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
    resendText: string;
    isOTPVerified: boolean;
    onOTPChange: (value: string) => void;
    onVerify: () => void;
    onResend: () => void;
}

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
    resendText,
    isOTPVerified,
    onOTPChange,
    onVerify,
    onResend,
}) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
                    >
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="size-10 bg-rosewood-gradient rounded-xl flex items-center justify-center shadow-md shadow-rosewood/20 shrink-0">
                                        <span className="material-symbols-outlined text-ivory text-lg font-variation-fill">verified</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-lg font-bold text-rosewood tracking-tight truncate leading-tight ${isTamil ? 'font-sans' : 'font-serif'}`}>
                                            {otpBtnText}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="size-8 flex items-center justify-center rounded-full bg-rosewood-gradient text-ivory hover:rotate-90 transition-all duration-300 ml-4 shrink-0 shadow-sm shadow-rosewood/20"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {!isOTPVerified ? (
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <p className="text-slate-600 text-sm leading-relaxed">
                                                {otpInfoText}
                                            </p>
                                            <p className="text-rosewood/50 text-xs break-all font-medium">
                                                {email}
                                            </p>
                                        </div>
                                        <OTPInput
                                            value={otp}
                                            onChange={onOTPChange}
                                            error={error}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-ivory-gold-gradient rounded-2xl text-xs font-black uppercase tracking-widest">
                                            <span className="material-symbols-outlined text-lg font-variation-fill">check_circle</span>
                                            <span>{otpVerifySuccessText}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isOTPVerified && (
                                <div className="px-6 py-4 border-t border-slate-100 shrink-0 space-y-3">
                                    <button
                                        type="button"
                                        onClick={onVerify}
                                        disabled={verifyIsPending || otp.length !== 6}
                                        className="w-full py-3.5 bg-rosewood text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-md shadow-rosewood/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {verifyIsPending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>{verifyingText}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-base">verified</span>
                                                <span>{otpBtnText}</span>
                                            </>
                                        )}
                                    </button>
                                    <div className="flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={onResend}
                                            disabled={sendIsPending}
                                            className="text-xs font-medium text-rosewood/50 hover:text-rosewood transition-colors flex items-center gap-1.5 py-2 min-h-[44px]"
                                        >
                                            {sendIsPending ? (
                                                <div className="w-3.5 h-3.5 border-2 border-rosewood/20 border-t-rosewood rounded-full animate-spin" />
                                            ) : (
                                                <span className="material-symbols-outlined text-sm">refresh</span>
                                            )}
                                            {resendText}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};