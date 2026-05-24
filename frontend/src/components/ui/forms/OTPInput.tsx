import React, { useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  isVerifying?: boolean;
  onComplete?: (value: string) => void;
  onResend?: () => void;
  resendTimer?: number;
  isExpired?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  isVerifying = false,
  onComplete,
  onResend,
  resendTimer,
  isExpired = false,
}) => {
  const { t } = useLanguage();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const safeValue = value.slice(0, 6);
  const otpArray = safeValue.split('').concat(Array(Math.max(0, 6 - safeValue.length)).fill(''));

  const isDisabled = disabled || isVerifying || isExpired;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (isExpired) return;
    const val = e.target.value;
    const lastDigit = val.slice(-1);

    if (!lastDigit) {
      const newOtpArray = [...otpArray];
      newOtpArray[index] = '';
      const newValue = newOtpArray.join('').slice(0, 6);
      onChange(newValue);
      return;
    }

    if (lastDigit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    const newOtpArray = [...otpArray];
    newOtpArray[index] = lastDigit;
    const newValue = newOtpArray.join('').slice(0, 6);
    onChange(newValue);

    if (newValue.length === 6 && onComplete && !isExpired) {
      onComplete(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      onChange(pasteData);

      const nextIndex = Math.min(pasteData.length, 5);
      inputsRef.current[nextIndex]?.focus();

      if (pasteData.length === 6 && onComplete && !isExpired) {
        onComplete(pasteData);
      }
    },
    [isDisabled, onChange, onComplete, isExpired],
  );

  useEffect(() => {
    const firstInput = inputsRef.current[0];
    if (firstInput && !isDisabled) {
      firstInput.focus();
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          className={`grid grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 max-w-[360px] sm:max-w-[400px] md:max-w-[440px] mx-auto ${
            isVerifying || isExpired ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {otpArray.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={isDisabled}
              className={`otp-input-box ${
                error ? 'otp-input-box--error' : digit ? 'otp-input-box--filled' : ''
              } ${isDisabled ? 'cursor-not-allowed' : ''}`}
            />
          ))}
        </div>
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-red-500 font-variation-bold">timer_off</span>
              <span className="text-xs font-bold text-red-500">Code expired</span>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
      {resendTimer !== undefined && (
        <div className="text-center pt-2">
          {resendTimer > 0 ? (
            <p className="text-[11px] font-bold text-logo-dark/50">
              Resend in <span className="text-rosewood">{resendTimer}s</span>
            </p>
          ) : onResend ? (
            <button
              type="button"
              onClick={onResend}
              disabled={isVerifying}
              className="text-[11px] font-bold text-rosewood hover:text-dark-brown transition-colors disabled:opacity-50"
            >
              Resend code
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
