import React, { useRef } from 'react';

export interface EmailFieldProps {
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
    disabled?: boolean;
    readOnly?: boolean;
    labelSuffix?: React.ReactNode;
}

export const EmailField: React.FC<EmailFieldProps> = ({
    label,
    icon = 'mail',
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
    disabled = false,
    readOnly = false,
    labelSuffix,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={`space-y-1 group text-left ${className}`}>
            <div className={`flex items-center ${labelSuffix ? 'justify-between' : 'justify-start'} gap-1 px-1`}>
                {label && (
                    <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">
                        {label}
                        {required && <span className="text-gold ml-1 text-xs">*</span>}
                    </label>
                )}
                {labelSuffix}
            </div>

            <div className="relative h-14">
                <div className={`
                    absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 w-5 h-5
                    ${error ? 'text-red-400' : 'text-input-icon group-focus-within:scale-110'}
                `}>
                    <span className="material-symbols-outlined text-[20px] font-variation-medium">
                        {icon}
                    </span>
                </div>

                <input
                    ref={inputRef}
                    name={name}
                    type="email"
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    readOnly={readOnly}
                    autoComplete={autoComplete || 'email'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`
                        w-full h-full pl-12 pr-4 
                        rounded-xl border transition-all text-sm font-input-text placeholder:text-input-placeholder text-input-text
                        ${readOnly || disabled ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-input-bg'}
                        ${error 
                            ? 'border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/5' 
                            : 'border-input-border focus:border-input-focus focus:ring-4 focus:ring-input-ring shadow-sm shadow-input-shadow hover:border-input-border-hover'}
                        outline-none
                    `}
                />
            </div>

            {error && (
                <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};
