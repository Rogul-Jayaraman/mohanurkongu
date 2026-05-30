import React, { useEffect } from 'react';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { useLanguage } from '@/context/LanguageContext';
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
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={
                <div className="size-10 bg-rosewood rounded-xl flex items-center justify-center shadow-md shadow-rosewood/20 shrink-0">
                    <ShieldCheck size={20} className="text-ivory" />
                </div>
            }
            title={otpBtnText}
            size="sm"
            footer={
                !isOTPVerified ? (
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
                                <ShieldCheck size={16} />
                                <span>{otpBtnText}</span>
                            </>
                        )}
                    </button>
                ) : undefined
            }
        >
            {!isOTPVerified ? (
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <p className="text-rosewood/60 text-sm leading-relaxed">
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
                        onResend={onResend}
                        resendTimer={resendTimer}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-rosewood/10 rounded-2xl text-xs font-black uppercase tracking-widest text-rosewood">
                        <CheckCircle size={20} className="text-emerald-600" />
                        <span>{otpVerifySuccessText}</span>
                    </div>
                </div>
            )}
        </ModalShell>
    );
};
