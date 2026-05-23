import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Mail } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { OTPInput } from '@/components/ui/forms/OTPInput';
import { Spinner } from '@/components/ui/feedback/Spinner';

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
    const { t, language } = useLanguage();

    useEffect(() => {
        if (isOpen) { document.body.style.overflow = 'hidden'; }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gold-soft/20 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-gold/20"
                    >
                        <div className="p-6 pb-0 flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <h3 className={`text-xl font-bold text-rosewood ${language === 'ta' ? 'font-sans' : 'font-serif'}`}>
                                    {otpBtnText}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed mt-1">{otpInfoText}</p>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-ivory rounded-xl border border-gold/10">
                                <Mail size={16} className="text-gold shrink-0" />
                                <span className="text-xs font-medium text-rosewood/60 truncate">{email}</span>
                            </div>

                            {isOTPVerified ? (
                                <div className="py-6 text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100">
                                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                                    </div>
                                    <p className="text-sm font-bold text-emerald-600">{otpVerifySuccessText}</p>
                                    <button
                                        onClick={onClose}
                                        className="mt-2 text-xs font-bold text-rosewood hover:text-gold transition-colors"
                                    >
                                        {language === 'ta' ? 'தொடரவும்' : 'Continue'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <OTPInput
                                        value={otp}
                                        onChange={onOTPChange}
                                        error={error}
                                        isVerifying={verifyIsPending}
                                        onComplete={onVerify}
                                    />

                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">info</span>
                                            {t('signup.otpWarning')}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={onResend}
                                            disabled={sendIsPending}
                                            className="text-[10px] font-bold text-rosewood hover:text-gold transition-colors flex items-center gap-1 uppercase tracking-tighter disabled:opacity-50"
                                        >
                                            {sendIsPending ? (
                                                <Spinner size="sm" color="rosewood" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[12px]">refresh</span>
                                                    {resendText}
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onVerify}
                                        disabled={otp.length !== 6 || verifyIsPending}
                                        className="w-full py-3.5 bg-rosewood text-white font-bold rounded-xl text-sm shadow-lg shadow-rosewood/20 hover:opacity-90 transition-all active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {verifyIsPending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>{verifyingText}</span>
                                            </>
                                        ) : (
                                            otpBtnText
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
