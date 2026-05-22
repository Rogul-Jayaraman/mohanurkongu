import React, { useRef } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, error, disabled = false }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Ensure value is at most 6 characters
  const safeValue = value.slice(0, 6);
  const otpArray = safeValue.split('').concat(Array(Math.max(0, 6 - safeValue.length)).fill(''));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    const lastDigit = val.slice(-1);
    
    // Auto-focus logic
    if (lastDigit && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    const newOtpArray = [...otpArray];
    newOtpArray[index] = lastDigit;
    onChange(newOtpArray.join('').slice(0, 6));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasteData);
    
    // Focus last character's input if it was a paste
    const nextIndex = Math.min(pasteData.length, 5);
    inputs.current[nextIndex]?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 max-w-[360px] sm:max-w-[400px] md:max-w-[440px] mx-auto">
        {otpArray.map((digit, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            ref={(el) => { inputs.current[index] = el; }}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            className={`otp-input-box ${error ? 'otp-input-box--error' : digit ? 'otp-input-box--filled' : ''}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
