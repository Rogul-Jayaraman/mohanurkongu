import React, { useState } from 'react';
import { PasswordStrengthIndicator } from '@/components/ui/feedback/StrengthIndicator';
import { useLanguage } from '@/context/LanguageContext';
import { useCapsLock } from '@/context/CapsLockContext';

export interface PasswordFieldProps {
  label: string;
  icon?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  showStrength?: boolean;
  strengthPassword?: string;
  disabled?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  icon = 'lock',
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  className = '',
  autoComplete,
  onFocus,
  onBlur,
  showStrength = false,
  strengthPassword,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const { capsLock } = useCapsLock();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`space-y-1 group text-left ${className}`}>
      <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">
        {label}
        {required && <span className="text-gold ml-1 text-xs">*</span>}
      </label>

      <div className="relative h-14">
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 w-5 h-5 ${
            error ? 'text-red-400' : 'text-input-icon group-focus-within:scale-110'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] font-variation-medium">{icon}</span>
        </div>

        <input
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
          className={`w-full h-full pl-12 pr-12 rounded-xl border transition-all text-sm font-input-text placeholder:text-input-placeholder text-input-text bg-input-bg outline-none ${
            error
              ? 'border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/5'
              : 'border-input-border focus:border-input-focus focus:ring-4 focus:ring-input-ring shadow-sm shadow-input-shadow hover:border-input-border-hover'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword(!showPassword)}
            className={`text-input-icon transition-all duration-300 flex items-center active:scale-95 ${
              showPassword
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
            }`}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      {capsLock && (
        <div className="flex items-center gap-1.5 px-1 py-1">
          <span className="material-symbols-outlined text-[12px] text-amber-500">warning</span>
            <span className="text-[10px] font-medium text-amber-600">{t('common.capsLockOn')}</span>
        </div>
      )}

      {showStrength && (
        <PasswordStrengthIndicator password={strengthPassword || value} />
      )}

      {error && (
        <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
