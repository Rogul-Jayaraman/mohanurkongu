import React, { useState, useRef, useEffect } from 'react';
import { countryCodes, type CountryCode } from '@/types/countries';
import { TamilKeyboard } from './TamilKeyboard';
import { TransliteratingInput } from './PhoneticInput';
import { useInputFormatting } from '@/hooks/useInputFormatting';
import { useLanguage } from '@/context/LanguageContext';
import { useDualScript } from '@/hooks/useDualScript';

export interface InputProps {
    label: string;
    icon: string;
    name: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    // Phone specific props
    isPhone?: boolean;
    onPhoneChange?: (fullNumber: string, dialCode: string, rawNumber: string) => void;
    defaultDialCode?: string;
    
    className?: string;
    error?: string;
    children?: React.ReactNode;
    labelSuffix?: React.ReactNode;
    readOnly?: boolean;
    disabled?: boolean;
    maxLength?: number;
    targetLanguage?: 'ta' | 'en';
    forceLowercase?: boolean;
    autoCapitalize?: string;
    autoComplete?: string;
    autoCorrect?: string;
    spellCheck?: boolean;
    inputMode?: "search" | "text" | "email" | "tel" | "url" | "numeric" | "decimal" | "none";
    autoFormat?: boolean;
    showKeyboardToggle?: boolean;
    onKeyPress?: React.KeyboardEventHandler<any>;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    name,
    type = 'text',
    required = false,
    placeholder,
    value,
    onChange,
    isPhone = false,
    onPhoneChange,
    defaultDialCode = '+91',
    className = "",
    error,
    children,
    labelSuffix,
    readOnly = false,
    disabled = false,
    maxLength,
    targetLanguage,
    forceLowercase,
    autoCapitalize,
    autoComplete,
    autoCorrect,
    spellCheck,
    inputMode,
    autoFormat = false,
    showKeyboardToggle = false,
    onKeyPress,
    onFocus,
    onBlur
}) => {
    const { t } = useLanguage();
    // ─── Phone Logic ───
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
        countryCodes.find((c: CountryCode) => c.dial_code === defaultDialCode) || countryCodes[0]
    );
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ─── Tamil Keyboard Logic ───
    const {
        isKeyboardOpen,
        closeKeyboard,
        toggleKeyboard,
        insertKey,
        handleBackspace,
        handleSpace,
        handleEnter,
    } = useDualScript({ targetLanguage: targetLanguage || 'ta' });

    const updateInputState = (newVal: string, newPos: number) => {
        const input = inputRef.current;
        if (!input) return;

        const syntheticEvent = {
            target: { name, value: newVal }
        } as React.ChangeEvent<HTMLInputElement>;

        if (onChange) onChange(syntheticEvent);

        setTimeout(() => {
            input.focus();
            input.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleKeyboardSelect = (char: string) => {
        const input = inputRef.current;
        if (!input) return;

        const newState = insertKey({
            text: value || '',
            cursorPosition: input.selectionStart || 0
        }, char);

        updateInputState(newState.text, newState.cursorPosition);
    };

    const handleKeyboardBackspace = () => {
        const input = inputRef.current;
        if (!input) return;

        const newState = handleBackspace({
            text: value || '',
            cursorPosition: input.selectionStart || 0
        });

        updateInputState(newState.text, newState.cursorPosition);
    };

    const handleKeyboardSpace = () => {
        const input = inputRef.current;
        if (!input) return;

        const newState = handleSpace({
            text: value || '',
            cursorPosition: input.selectionStart || 0
        });

        updateInputState(newState.text, newState.cursorPosition);
    };

    const handleKeyboardEnter = () => {
        const input = inputRef.current;
        if (!input) return;

        const newState = handleEnter({
            text: value || '',
            cursorPosition: input.selectionStart || 0
        });

        updateInputState(newState.text, newState.cursorPosition);
    };

    useEffect(() => {
        if (isDropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else {
            setSearchQuery('');
        }
    }, [isDropdownOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = countryCodes.filter((c: CountryCode) => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.dial_code.includes(searchQuery)
    );

    const handleCountrySelect = (country: CountryCode) => {
        setSelectedCountry(country);
        setIsDropdownOpen(false);
        if (onPhoneChange) {
            const formattedFull = `${country.dial_code} - ${value || ''}`;
            onPhoneChange(formattedFull, country.dial_code, value || '');
        }
    };

    const { formatValue } = useInputFormatting();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isPhone) {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            const syntheticEvent = {
                ...e,
                target: { ...e.target, value: val, name: name }
            } as React.ChangeEvent<HTMLInputElement>;
            
            if (onChange) onChange(syntheticEvent);
            if (onPhoneChange) {
                const formattedFull = `${selectedCountry.dial_code} - ${val}`;
                onPhoneChange(formattedFull, selectedCountry.dial_code, val);
            }
        } else {
            const val = e.target.value;
            const formattedVal = formatValue(val, { type, forceLowercase, autoFormat });
            
            if (formattedVal !== val) {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, value: formattedVal, name: name }
                } as React.ChangeEvent<HTMLInputElement>;
                if (onChange) onChange(syntheticEvent);
            } else {
                if (onChange) onChange(e);
            }
        }
    };

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

            <div className={`flex items-stretch gap-2 ${isPhone ? '' : 'relative'}`}>
                {/* ─── Country Code Dropdown (Only for Phone) ─── */}
                {isPhone && (
                    <div className="relative shrink-0" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
                            className={`
                                h-14 px-4 flex items-center gap-2 rounded-xl border transition-all
                                ${isDropdownOpen ? 'border-gold ring-4 ring-gold/5 bg-white shadow-sm' : 'border-gold/20 bg-white hover:border-gold/40'}
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span className="text-sm font-input-text text-input-text">{selectedCountry.dial_code}</span>
                            <span className={`material-symbols-outlined text-input-placeholder text-[18px] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 z-60 w-72 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2 border-b border-slate-100 bg-slate-50">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder={t('common:search')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 bg-input-bg border border-input-border rounded-lg text-xs outline-none focus:border-input-focus transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                                    {filteredCountries.length > 0 ? (
                                        filteredCountries.map((country: CountryCode) => (
                                            <button
                                                key={`${country.code}-${country.dial_code}`}
                                                type="button"
                                                onClick={() => handleCountrySelect(country)}
                                                onKeyPress={onKeyPress}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left ${selectedCountry.code === country.code ? 'bg-gold/5 text-gold' : 'text-slate-700'}`}
                                            >
                                                <span className="text-xl">{country.flag}</span>
                                                <span className="text-sm font-input-text w-12">{country.dial_code}</span>
                                                <span className="text-xs font-input-text truncate flex-1">{country.name}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-8 text-center text-slate-400 italic text-xs">No results matched</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Main Input Container ─── */}
                <div 
                    ref={inputContainerRef}
                    className={`relative flex-1 group ${!isPhone ? 'h-14' : ''} ${className.includes('h-') ? className.match(/h-\d+/)?.[0] : ''}`}
                >
                    <div className={`
                        absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 w-5 h-5
                        ${error ? 'text-red-400' : 'text-input-icon group-focus-within:scale-110'}
                    `}>
                        <span className="material-symbols-outlined text-[20px] font-variation-medium">
                            {isPhone ? 'call' : icon}
                        </span>
                    </div>

                    <TransliteratingInput
                        ref={inputRef}
                        name={name}
                        type={isPhone ? 'tel' : type}
                        required={required}
                        value={value}
                        onChange={handleInputChange}
                        onKeyPress={onKeyPress}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        onWheel={(e) => e.currentTarget.type === 'number' && e.currentTarget.blur()}
                        placeholder={placeholder}
                        readOnly={readOnly}
                        disabled={disabled}
                        maxLength={maxLength}
                        targetLanguage={targetLanguage}
                        autoCapitalize={autoCapitalize || (type === 'email' ? 'none' : undefined)}
                        autoComplete={autoComplete}
                        autoCorrect={autoCorrect || (type === 'email' ? 'off' : undefined)}
                        spellCheck={spellCheck}
                        inputMode={inputMode || (type === 'email' ? 'email' : undefined)}
                        autoFormat={autoFormat}
                        className={`
                            w-full h-full pl-12 ${children ? 'pr-12' : 'pr-4'} 
                            rounded-xl border transition-all text-sm font-input-text placeholder:text-input-placeholder text-input-text
                            ${readOnly || disabled ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-input-bg'}
                            ${error 
                                ? 'border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/5' 
                                : 'border-input-border focus:border-input-focus focus:ring-4 focus:ring-input-ring shadow-sm shadow-input-shadow hover:border-input-border-hover'}
                            outline-none
                        `}
                    />

                    {/* Actions Layer */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {((targetLanguage === 'ta' || showKeyboardToggle) && 
                          !disabled && !readOnly && 
                          type !== 'number' && !isPhone && type !== 'email') && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={toggleKeyboard}
                                className={`
                                    flex items-center justify-center size-8 rounded-lg transition-all
                                    ${isKeyboardOpen ? 'bg-rosewood text-white shadow-lg shadow-rosewood/20' : 'bg-gold/5 text-rosewood hover:bg-gold/10 border border-gold/10'}
                                `}
                                title="On-screen Tamil Keyboard"
                            >
                                <span className="material-symbols-outlined text-[18px]">keyboard</span>
                            </button>
                        )}
                        {children}
                    </div>
                </div>
            </div>

            <TamilKeyboard
                isOpen={isKeyboardOpen}
                onClose={closeKeyboard}
                onKeyPress={handleKeyboardSelect}
                onBackspace={handleKeyboardBackspace}
                onSpace={handleKeyboardSpace}
                onEnter={handleKeyboardEnter}
            />

            {error && (
                <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};
