import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Languages } from 'lucide-react';
import { useTransliterate } from '../../hooks/useTransliterate';
import { useTranslations } from '../../hooks/useTranslations';
import { useInputFormatting } from '../../hooks/useInputFormatting';
import { TamilKeyboard } from './forms/TamilKeyboard';
import { useDualScript } from '../../hooks/useDualScript';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    onFilterClick?: (filterKey?: string) => void;
    placeholder?: string;
    className?: string;
    autoFormat?: boolean;
}

/**
 * SearchBar component for shared search functionality across the app.
 * Features a modern, premium search input with optional filter capabilities and Tamil transliteration.
 */
export const SearchBar: React.FC<SearchBarProps> = ({ 
    searchQuery, 
    setSearchQuery, 
    onFilterClick,
    placeholder,
    className = "",
    autoFormat = false
}) => {
    const { t, i18n } = useTranslations(['common', 'dashboard']);
    const { formatValue } = useInputFormatting();
    
    const isTamil = i18n.language === 'ta';
    
    // Use the optimized transliteration hook
    const { preview, isPending } = useTransliterate(searchQuery, { targetLanguage: 'ta' });

    // ─── Tamil Keyboard Logic ───
    const {
        isKeyboardOpen,
        closeKeyboard,
        toggleKeyboard,
        insertKey,
        handleBackspace,
    } = useDualScript({ text: searchQuery, targetLanguage: 'ta' });
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleKeyboardSelect = (char: string) => {
        const input = inputRef.current;
        if (!input) return;

        const newState = insertKey({
            text: searchQuery || '',
            cursorPosition: input.selectionStart || 0
        }, char);

        setSearchQuery(newState.text);

        setTimeout(() => {
            input.focus();
            input.setSelectionRange(newState.cursorPosition, newState.cursorPosition);
        }, 0);
    };

    const handleKeyboardBackspace = () => {
        const input = inputRef.current;
        if (!input) return;

        const newState = handleBackspace({
            text: searchQuery || '',
            cursorPosition: input.selectionStart || 0
        });

        setSearchQuery(newState.text);

        setTimeout(() => {
            input.focus();
            input.setSelectionRange(newState.cursorPosition, newState.cursorPosition);
        }, 0);
    };

    // Automatically apply transliteration when the app is in Tamil mode
    useEffect(() => {
        if (isTamil && preview && preview !== searchQuery && /[a-zA-Z]/.test(searchQuery)) {
            const timeout = setTimeout(() => {
                setSearchQuery(preview);
            }, 600);
            return () => clearTimeout(timeout);
        }
    }, [preview, isTamil, searchQuery, setSearchQuery]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const formattedVal = formatValue(val, { mode: 'sentence', autoFormat });
        setSearchQuery(formattedVal);
    };

    return (
        <div className={`w-full ${className}`}>
            <div className="flex items-center gap-2 md:gap-4 w-full">
                {/* Search Bar Container - Modern & Responsive */}
                <div className="flex-1 rounded-full bg-white border border-gold/20 flex items-center h-11 md:h-12 relative overflow-hidden group transition-all duration-300 focus-within:border-gold/40 focus-within:shadow-lg focus-within:shadow-gold/5">
                    <div className="absolute left-4 text-rosewood/40 group-focus-within:text-gold transition-colors duration-300 z-10">
                        <Search size={18} />
                    </div>
                    
                    <input 
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleTextChange}
                        placeholder={placeholder || t('common:search')}
                        className="w-full h-full pl-11 pr-32 bg-transparent border-none outline-none text-slate-700 font-medium placeholder:text-gold-soft text-sm"
                    />

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                        {isTamil && (
                            <button
                                type="button"
                                onClick={toggleKeyboard}
                                className={`
                                    flex items-center justify-center size-8 rounded-lg transition-all
                                    ${isKeyboardOpen ? 'bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 text-white shadow-lg' : 'bg-gold/5 text-rosewood hover:bg-gold/10 border border-gold/10'}
                                `}
                                title="Tamil Keyboard"
                            >
                                <span className="material-symbols-outlined text-[18px]">keyboard</span>
                            </button>
                        )}

                        {/* Pending Indicator (Subtle) */}
                        {isPending && isTamil && (
                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm pl-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-gold animate-ping opacity-75" />
                            </div>
                        )}
                    </div>
                </div>

                {onFilterClick && (
                    <button 
                        onClick={() => onFilterClick()}
                        className="flex items-center justify-center size-11 md:size-12 bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 hover:from-rosewood hover:to-dark-rosewood text-white rounded-full transition-all duration-300 group hover:scale-[1.02] active:scale-95 whitespace-nowrap shadow-md shadow-rosewood/10"
                    >
                        <SlidersHorizontal size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                )}
            </div>

            {/* Dynamic Search result indicator */}
            {searchQuery.trim() && (
                <div className="mt-2 px-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-xs font-medium text-rosewood/60 tracking-tight">
                        {t('dashboard:showing_results_for', { query: searchQuery })}
                    </p>
                </div>
            )}

            <TamilKeyboard
                isOpen={isKeyboardOpen}
                onClose={closeKeyboard}
                onKeyPress={handleKeyboardSelect}
                onBackspace={handleKeyboardBackspace}
                onSpace={() => handleKeyboardSelect(' ')}
                onEnter={closeKeyboard}
            />
        </div>
    );
};
