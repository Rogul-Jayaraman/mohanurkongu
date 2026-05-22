import React, { useState, useRef, useEffect } from 'react';
import { countryCodes, type CountryCode } from '../../../types/countries';
import { useLanguage } from '../../../context/LanguageContext';

interface PhoneInputProps {
    label: string;
    name: string;
    required?: boolean;
    defaultValue?: string;
    defaultCountry?: string;
    placeholder?: string;
    onChange?: (fullNumber: string) => void;
    error?: string;
    labelSuffix?: React.ReactNode;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    label,
    name,
    required = false,
    defaultValue = '',
    defaultCountry = '+91',
    placeholder = '',
    onChange,
    error,
    labelSuffix
}) => {
    const { t, language } = useLanguage();
    const regionNames = new Intl.DisplayNames([language === 'ta' ? 'ta' : 'en'], { type: 'region' });

    const getCountryName = (code: string, fallback: string) => {
        try {
            return regionNames.of(code) || fallback;
        } catch {
            return fallback;
        }
    };

    const parseDefaultValue = (): { country: CountryCode; raw: string } => {
        const parts = defaultValue.split(' - ');
        const dialCode = parts[0] || defaultCountry;
        const raw = parts[1] || '';
        const found = countryCodes.find((c: CountryCode) => c.dial_code === dialCode);
        return {
            country: found || countryCodes.find((c: CountryCode) => c.code === 'IN') || countryCodes[0],
            raw
        };
    };

    const parsed = parseDefaultValue();
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(parsed.country);
    const [phoneNumber, setPhoneNumber] = useState(parsed.raw);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = countryCodes.filter((c: CountryCode) => {
        const cName = getCountryName(c.code, c.name);
        return cName.toLowerCase().includes(searchQuery.toLowerCase()) || 
               c.dial_code.includes(searchQuery) ||
               c.code.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const emitChange = (country: CountryCode, raw: string) => {
        if (onChange) {
            const formattedFull = `${country.dial_code} - ${raw}`;
            onChange(formattedFull);
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhoneNumber(val);
        emitChange(selectedCountry, val);
    };

    const handleCountrySelect = (country: CountryCode) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearchQuery('');
        emitChange(country, phoneNumber);
    };

    const borderColor = error ? 'border-red-400' : 'border-gold/30';
    const focusRing = error ? 'focus-within:ring-1 focus-within:ring-red-400' : 'focus-within:border-gold focus-within:ring-1 focus-within:ring-gold';

    return (
        <div className="space-y-1 w-full">
            <div className={`flex items-center ${labelSuffix ? 'justify-between' : 'justify-start'} gap-1 px-1`}>
                <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight">
                    {label}
                    {required && <span className="text-gold ml-1 text-xs">*</span>}
                </label>
                {labelSuffix}
            </div>

            <div className={`relative flex items-stretch w-full h-[54px] md:h-14 bg-white border ${borderColor} ${focusRing} rounded-xl transition-all shadow-sm`}>
                {/* Country Selector */}
                <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-1 px-3 h-full bg-white hover:bg-ivory/50 transition-colors border-r border-gold/20 rounded-l-xl overflow-hidden"
                    >
                        <span className="text-base sm:text-lg leading-none">{selectedCountry.flag}</span>
                        <span className="text-sm font-semibold text-slate-700">{selectedCountry.dial_code}</span>
                        <span className={`material-symbols-outlined text-[16px] sm:text-[18px] text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-72 bg-white border border-gold/10 rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-2 border-b border-slate-100 bg-slate-50">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder={t('common:search')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-gold transition-all"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[250px] overflow-y-auto py-1 text-left">
                                {filteredCountries.length > 0 ? (
                                    filteredCountries.map((country: CountryCode) => (
                                        <button
                                            key={`${country.code}-${country.dial_code}`}
                                            type="button"
                                            onClick={() => handleCountrySelect(country)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ivory transition-colors text-left ${selectedCountry.code === country.code ? 'bg-rosewood/5 text-rosewood' : 'text-slate-700'}`}
                                        >
                                            <span className="text-lg">{country.flag}</span>
                                            <span className="text-sm w-12 text-left">{country.dial_code}</span>
                                            <span className="text-xs truncate flex-1">{getCountryName(country.code, country.name)}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-slate-400 italic text-xs">
                                        {t('phoneInput.notFound')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Phone Number Input */}
                <div className="flex-1 flex items-center rounded-r-xl overflow-hidden">
                    <span className={`material-symbols-outlined pl-3 text-xl transition-colors ${error ? 'text-red-400' : 'text-gold'}`}>call</span>
                    <input
                        type="tel"
                        name={name}
                        required={required}
                        value={phoneNumber}
                        onChange={handleNumberChange}
                        placeholder={placeholder}
                        className="w-full h-full px-2 outline-none text-base text-slate-800 bg-transparent"
                    />
                </div>
            </div>

            {error && <p className="text-[10px] font-bold text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
        </div>
    );
};
