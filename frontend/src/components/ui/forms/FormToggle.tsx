import React from 'react';
import { useTranslation } from 'react-i18next';

type ToggleOption = {
    value: string;
    label: string | { en: string; ta: string };
    labelTa?: string;
};

interface FormToggleProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: ToggleOption[];
    required?: boolean;
    name: string;
    error?: string;
    onBlur?: () => void;
}

/**
 * A segmented control toggle component for fields with few options (2-3).
 * Matches the 'Diet' selection style requested by the user.
 */
const FormToggle: React.FC<FormToggleProps> = ({
    label,
    value,
    onChange,
    options,
    required,
    name,
    error,
    onBlur
}) => {
    const { i18n } = useTranslation();
    const lang = i18n.language as 'en' | 'ta';

    /**
     * Handles keyboard navigation for the segmented control.
     * Use Arrows to move between options and Enter/Space to select.
     */
    const handleKeyDown = (e: React.KeyboardEvent, optValue: string, index: number) => {
        let nextIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = (index + 1) % options.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = (index - 1 + options.length) % options.length;
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(optValue);
        }

        if (nextIndex !== -1) {
            const nextOpt = options[nextIndex];
            const nextEl = document.querySelector(`input[name="${name}"][value="${nextOpt.value}"]`)?.parentElement as HTMLElement;
            nextEl?.focus();
            onChange(nextOpt.value);
        }
    };

    return (
        <div className="space-y-2 w-full animate-in fade-in duration-500">
            <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">
                {label}
                {required && <span className="text-gold ml-1 text-xs">*</span>}
            </label>
            
            <div 
                className="flex flex-wrap gap-2 p-1.5 bg-ivory rounded-xl border border-gold-soft/10 w-full lg:w-fit"
                role="radiogroup"
                aria-label={label}
            >
                {options.map((opt, index) => (
                    <label 
                        key={opt.value} 
                        tabIndex={value === opt.value || (!value && index === 0) ? 0 : -1}
                        onKeyDown={(e) => handleKeyDown(e, opt.value, index)}
                        className={`
                            flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl cursor-pointer transition-all duration-300
                            outline-none focus:ring-2 focus:ring-rosewood/30 focus:ring-offset-1
                            ${value === opt.value 
                                ? 'bg-rosewood shadow-lg shadow-rosewood/20 text-white' 
                                : 'text-rosewood/60 hover:text-rosewood hover:bg-white bg-transparent'
                            }
                        `}
                        role="radio"
                        aria-checked={value === opt.value}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={(e) => onChange(e.target.value)}
                            className="hidden"
                            tabIndex={-1}
                            onBlur={onBlur}
                        />
                        <span className="text-xs font-black tracking-wider whitespace-nowrap">
                            {typeof opt.label === 'object' ? (opt.label[lang] || opt.label.en) : (lang === 'ta' && opt.labelTa ? opt.labelTa : opt.label)}
                        </span>
                    </label>
                ))}
            </div>

            {error && (
                <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormToggle;
