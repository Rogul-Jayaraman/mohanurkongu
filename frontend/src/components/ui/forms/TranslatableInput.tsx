import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TransliteratedPreview } from './TransliteratedPreview';
import { Input } from '../forms/Input';

interface TranslatableInputProps {
    label: string;
    valueEn: string;
    valueTa: string;
    onChangeEn: (val: string) => void;
    onChangeTa: (val: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    icon?: string;
    autoFormat?: boolean;
    hideLangSwitcher?: boolean;
}

/**
 * A reusable input component that handles English-Tamil transliteration preview and manual override.
 * Reimplemented to match the SignupForm behavior and aesthetics.
 *
 * Auto-transliteration is gated inside TransliteratedPreview via isFocusedRef:
 *   - Auto-updates (isManual=false) only fire while the user is actively typing (isFocused=true).
 *   - Manual confirmations (isManual=true) always propagate regardless of focus state.
 * This prevents draft-loading from overwriting the counterpart language field.
 */
const TranslatableInput: React.FC<TranslatableInputProps> = ({
    label,
    valueEn,
    valueTa,
    onChangeEn,
    onChangeTa,
    placeholder,
    required,
    error,
    icon = 'edit_note',
    autoFormat = false,
    hideLangSwitcher = true
}) => {
    const { language } = useLanguage();
    const [activeScript, setActiveScript] = React.useState<'en' | 'ta'>(language === 'en' ? 'en' : 'ta');
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
        setActiveScript(language === 'en' ? 'en' : 'ta');
    }, [language]);

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between px-1">
                <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">
                    {label}
                    {required && <span className="text-gold ml-1 text-xs">*</span>}
                </label>
                
                {/* Script Switcher */}
                {!hideLangSwitcher && (
                <div className="flex bg-ivory/50 p-0.5 rounded-lg border border-gold-soft/10 scale-90 origin-right">
                    <button
                        type="button"
                        onClick={() => setActiveScript('en')}
                        className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase transition-all ${
                            activeScript === 'en' 
                                ? 'bg-rosewood text-white shadow-sm' 
                                : 'text-rosewood/60 hover:text-rosewood'
                        }`}
                    >
                        EN
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveScript('ta')}
                        className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest transition-all ${
                            activeScript === 'ta' 
                                ? 'bg-rosewood text-white shadow-sm' 
                                : 'text-rosewood/60 hover:text-rosewood font-manrope'
                        }`}
                    >
                        த
                    </button>
                </div>
                )}
            </div>

            <Input
                label="" // Handled by our custom label above for better layout with switcher
                icon={icon}
                name={activeScript === 'en' ? 'nameEn' : 'nameTa'}
                value={activeScript === 'en' ? valueEn : valueTa}
                targetLanguage={activeScript === 'ta' ? 'ta' : undefined}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (activeScript === 'en') {
                        onChangeEn(val);
                    } else {
                        onChangeTa(val);
                    }
                }}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') e.preventDefault(); }}
                error={error}
                placeholder={placeholder}
                required={required}
                autoFormat={autoFormat}
            />
            <TransliteratedPreview
                key={activeScript === 'en' ? 'ta' : 'en'}
                text={activeScript === 'en' ? valueEn : valueTa}
                isFocused={isFocused}
                onPreviewChange={(confirmed: string) => {
                    if (activeScript === 'en') {
                        onChangeTa(confirmed);
                    } else {
                        onChangeEn(confirmed);
                    }
                }}
            />
        </div>
    );
};

export default TranslatableInput;
