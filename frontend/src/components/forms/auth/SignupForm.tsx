import React from 'react';
import { Input } from '@/components/ui/forms/Input';
import { PhoneInput } from '@/components/ui/forms/PhoneInput';
import { OTPInput } from '@/components/ui/forms/OTPInput';
import { PasswordField } from '@/components/ui/forms/PasswordField';
import { EmailField } from '@/components/ui/forms/EmailField';
import { Spinner as LoadingSpinner } from '@/components/ui/feedback/Spinner';
import { TransliteratedPreview } from '@/components/ui/forms/TransliteratedPreview';

/**
 * SignupNameForm – name field with bilingual input and transliteration.
 */
export const SignupNameForm: React.FC<{
    label: string;
    placeholder: string;
    value: string;
    alternateValue: string;
    error?: string;
    targetLanguage: 'en' | 'ta';
    isFocused: boolean;
    onChange: (value: string) => void;
    onAutoCapitalizeChange: (value: string) => void;
    onPreviewChange: (value: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}> = ({ label, placeholder, value, alternateValue, error, targetLanguage, isFocused, onChange, onAutoCapitalizeChange, onPreviewChange, onFocus, onBlur }) => (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-1">
        <Input
            label={label}
            icon="person"
            name="fullname"
            value={value}
            onChange={(e) => onAutoCapitalizeChange(e.target.value)}
            error={error}
            placeholder={placeholder}
            required
            targetLanguage={targetLanguage}
            onFocus={onFocus}
            onBlur={onBlur}
        />
        <TransliteratedPreview
            key={targetLanguage === 'en' ? 'ta' : 'en'}
            text={value}
            value={alternateValue}
            mode="title"
            isFocused={isFocused}
            onPreviewChange={onPreviewChange}
        />
    </form>
);

/**
 * SignupEmailForm – email input with send OTP button and verified badge.
 */
export const SignupEmailForm: React.FC<{
    label: string;
    placeholder: string;
    value: string;
    error?: string;
    isValidEmail: boolean;
    isOTPVerified: boolean;
    sendIsPending: boolean;
    verifyIsPending: boolean;
    sendButtonText: string;
    resendText: string;
    verifyText: string;
    verifiedText: string;
    verified: boolean;
    onSendOTP: () => void;
    onChange: (value: string) => void;
}> = ({ label, placeholder, value, error, isValidEmail, isOTPVerified, sendIsPending, verifyIsPending, sendButtonText, resendText, verifyText, verifiedText, verified, onSendOTP, onChange }) => {
    return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
        <EmailField
            label={label}
            labelSuffix={verified ? (
                <span className="inline-flex items-center justify-center size-5 bg-rosewood-gradient text-white rounded-full shadow-sm shadow-rosewood/30">
                    <span className="material-symbols-outlined text-[11px]">verified</span>
                </span>
            ) : undefined}
            icon="mail"
            name="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            placeholder={placeholder}
            readOnly={isOTPVerified}
        />
        {isValidEmail && !isOTPVerified && (
            <button
                type="button"
                onClick={onSendOTP}
                disabled={sendIsPending || verifyIsPending}
                className="w-full py-3 bg-rosewood/5 text-rosewood border border-rosewood/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rosewood hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {sendIsPending ? (
                    <LoadingSpinner size="sm" color="rosewood" />
                ) : (
                    <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>{sendButtonText}</span>
                    </>
                )}
            </button>
        )}
    </form>
    );
};

/**
 * SignupOtpForm – OTP input with verify button and resend link.
 */
export const SignupOtpForm: React.FC<{
    otpLabel: string;
    otpBtnText: string;
    verifyingText: string;
    otpVerifySuccessText: string;
    otpInfoText: string;
    resendText: string;
    value: string;
    error?: string;
    isOTPVerified: boolean;
    verifyIsPending: boolean;
    sendIsPending: boolean;
    onOTPChange: (value: string) => void;
    onVerifyOTP: () => void;
    onResendOTP: () => void;
}> = ({ otpLabel, otpBtnText, verifyingText, otpVerifySuccessText, otpInfoText, resendText, value, error, isOTPVerified, verifyIsPending, sendIsPending, onOTPChange, onVerifyOTP, onResendOTP }) => (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <label className="block text-xs font-bold text-rosewood tracking-tight px-1">
            {otpLabel}
        </label>
        <div className="space-y-4">
            <OTPInput
                value={value}
                onChange={onOTPChange}
                error={error}
            />
            {!isOTPVerified ? (
                <button
                    type="button"
                    onClick={onVerifyOTP}
                    disabled={verifyIsPending || value.length !== 6}
                    className="w-full py-3 bg-rosewood/5 text-rosewood border border-rosewood/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rosewood hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {verifyIsPending ? (
                        <>
                            <LoadingSpinner size="sm" color="rosewood" />
                            <span>{verifyingText}</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            <span>{otpBtnText}</span>
                        </>
                    )}
                </button>
            ) : (
                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-black uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{otpVerifySuccessText}</span>
                </div>
            )}
        </div>
        {!isOTPVerified && (
            <div className="flex items-center justify-between px-1">
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">info</span>
                    {otpInfoText}
                </p>
                <button
                    type="button"
                    onClick={onResendOTP}
                    disabled={sendIsPending}
                    className="text-[10px] font-bold text-rosewood hover:text-gold transition-colors flex items-center gap-1 uppercase tracking-tighter"
                >
                    {sendIsPending ? <LoadingSpinner size="sm" color="rosewood" /> : <span className="material-symbols-outlined text-[12px]">refresh</span>}
                    {resendText}
                </button>
            </div>
        )}
    </form>
);

/**
 * SignupPhoneForm – phone number input (plain, no OTP).
 */
export const SignupPhoneForm: React.FC<{
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}> = ({ label, value, error, onChange }) => (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
        <PhoneInput
            label={label}
            name="phone"
            defaultValue={value}
            defaultCountry="+91"
            onChange={onChange}
            error={error}
        />
    </form>
);

/**
 * SignupPasswordForm – password + confirm password with strength indicator.
 */
export const SignupPasswordForm: React.FC<{
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    passwordValue: string;
    confirmPasswordValue: string;
    passwordError?: string;
    confirmPasswordError?: string;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
}> = ({ passwordLabel, passwordPlaceholder, confirmPasswordLabel, confirmPasswordPlaceholder, passwordValue, confirmPasswordValue, passwordError, confirmPasswordError, onPasswordChange, onConfirmPasswordChange }) => (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        <div className="space-y-1">
            <PasswordField
                label={passwordLabel}
                icon="lock"
                name="password"
                value={passwordValue}
                onChange={(e) => onPasswordChange(e.target.value)}
                error={passwordError}
                placeholder={passwordPlaceholder}
                required
                showStrength
            />
        </div>
        <PasswordField
            label={confirmPasswordLabel}
            icon="lock_reset"
            name="confirmPassword"
            value={confirmPasswordValue}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            error={confirmPasswordError}
            placeholder={confirmPasswordPlaceholder}
            required
        />
    </form>
);

/**
 * SignupTermsForm – terms acceptance checkbox.
 */
export const SignupTermsForm: React.FC<{
    termsText: string;
    checked: boolean;
    error?: string;
    onChange: (checked: boolean) => void;
}> = ({ termsText, checked, error, onChange }) => (
    <form onSubmit={(e) => e.preventDefault()} className="py-1">
        <div className="flex items-start gap-3">
            <input
                name="termsAccepted"
                required
                type="checkbox"
                id="terms"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded text-rosewood focus:ring-rosewood border-slate-300 cursor-pointer size-4 mt-0.5 accent-rosewood"
            />
            <label htmlFor="terms" className="text-[12px] text-slate-600 leading-relaxed font-manrope">
                {termsText}
            </label>
        </div>
        {error && <p className="text-[10px] font-bold text-red-500 mt-2 ml-7">{error}</p>}
    </form>
);

/**
 * SignupSubmitForm – submit button with login redirect link.
 */
export const SignupSubmitForm: React.FC<{
    submitText: string;
    awaitingVerifyText: string;
    verifyEmailFirstText: string;
    alreadyText: string;
    isOTPVerified: boolean;
    isOTPSent: boolean;
    signupIsPending: boolean;
    verifyIsPending: boolean;
    onSubmit: (e: React.FormEvent) => void;
}> = ({ submitText, awaitingVerifyText, verifyEmailFirstText, alreadyText, isOTPVerified, isOTPSent, signupIsPending, verifyIsPending, onSubmit }) => (
    <form onSubmit={onSubmit} className="pt-2 flex flex-col gap-4">
        <button
            disabled={signupIsPending || verifyIsPending}
            className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 btn-shine ${
                (signupIsPending || verifyIsPending || !isOTPVerified)
                ? 'bg-slate-300 shadow-none cursor-not-allowed'
                : 'bg-rosewood hover:shadow-rosewood/20 shadow-rosewood/10'
            }`}
            type="submit"
        >
            {signupIsPending ? (
                <LoadingSpinner size="sm" color="white" />
            ) : (
                <>
                    <span className="material-symbols-outlined text-[18px]">
                        {isOTPVerified ? 'person_add' : 'pending'}
                    </span>
                    <span>
                        {isOTPVerified
                            ? submitText
                            : (isOTPSent ? awaitingVerifyText : verifyEmailFirstText)
                        }
                    </span>
                </>
            )}
        </button>
        <div className="text-center">
            <a href="/manamaalai/login" className="text-xs font-bold text-gray-500 transition-colors hover:text-rosewood">
                {alreadyText}
            </a>
        </div>
    </form>
);
