import React from 'react';
import { useTranslation } from 'react-i18next';
import Dropdown, { DropdownOption } from './Dropdown';
import { getBilingualLabel } from '../../../utils/bilingual';

interface FormSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    bilingual?: boolean;
    className?: string;
    onBlur?: () => void;
}

/**
 * A reusable, premium-styled custom dropdown component with search.
 * Refactored to use the centralized Dropdown component for unified UI/UX.
 * Follows the Heritage Design System (Ivory/Gold/Rosewood).
 */
const FormSelect: React.FC<FormSelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false,
    error,
    disabled = false,
    bilingual = false,
    className = '',
    onBlur
}) => {
    const { t, i18n } = useTranslation(['common']);
    const lang = i18n.language as 'en' | 'ta';

    const defaultPlaceholder = placeholder || t('common:select_option');

    // Find the current selected option label for the trigger display
    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption
        ? (bilingual ? getBilingualLabel(selectedOption.label, lang) : (selectedOption.label[lang] || selectedOption.label.en))
        : '';

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">
                {label}
                {required && <span className="text-gold ml-1 text-xs">*</span>}
            </label>
            
            <Dropdown
                options={options}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={defaultPlaceholder}
                disabled={disabled}
                searchable={options.length > 6}
                bilingual={bilingual}
                className="w-full"
            />

            {error && (
                <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormSelect;
