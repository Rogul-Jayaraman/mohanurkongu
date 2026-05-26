import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getBilingualLabel } from '../../../utils/bilingual';

export interface DropdownOption {
    value: string;
    label: {
        en: string;
        ta: string;
    };
    icon?: string;
}

interface DropdownProps {
    trigger?: React.ReactNode;
    options: DropdownOption[];
    value?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    align?: 'left' | 'right' | 'center';
    searchable?: boolean;
    disabled?: boolean;
    bilingual?: boolean;
    className?: string;
    menuClassName?: string;
}

/**
 * A centralized, highly reusable Dropdown component.
 * Supports custom triggers, bilingual labels, search, and premium animations.
 * Part of the Heritage Design System.
 */
const Dropdown: React.FC<DropdownProps> = ({
    trigger,
    options,
    value,
    onChange,
    onBlur,
    placeholder,
    align = 'left',
    searchable = false,
    disabled = false,
    bilingual = false,
    className = '',
    menuClassName = ''
}) => {
    const { t, i18n } = useTranslation(['common']);
    const lang = i18n.language as 'en' | 'ta';
    
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openUpwards, setOpenUpwards] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const defaultPlaceholder = placeholder || t('common:select_option');

    // Find the current selected option label for the default trigger
    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption
        ? (bilingual ? getBilingualLabel(selectedOption.label, lang) : (selectedOption.label[lang] || selectedOption.label.en))
        : '';

    const filteredOptions = options.filter(opt => {
        if (!searchQuery) return true;
        const enLabel = (opt.label?.en || '').toLowerCase();
        const taLabel = (opt.label?.ta || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return enLabel.includes(query) || taLabel.includes(query);
    });

    // Reset active index when filtered options change
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                setOpenUpwards(spaceBelow < 320 && rect.top > 320);
            }
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, searchable]);

    /**
     * Scroll the active option into view when navigating via keyboard.
     * Why: Ensures the user always sees what they are selecting in long lists.
     */
    useEffect(() => {
        if (activeIndex >= 0 && menuRef.current) {
            const activeElement = menuRef.current.querySelectorAll('button')[activeIndex];
            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [activeIndex]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setSearchQuery('');
                setActiveIndex(-1);
            }
        }
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery('');
        setActiveIndex(-1);
    };

    /**
     * Centralized keyboard handling for the dropdown.
     * What it does: Manages list navigation and selection.
     * Why it is used: Core of the Keyboard Accessible Form System.
     * Edge cases: 
     * - Loop behavior: Arrows loop from end to beginning.
     * - Escape: Closes dropdown and returns focus.
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && filteredOptions[activeIndex]) {
                    handleSelect(filteredOptions[activeIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                // Close on tab to allow natural navigation
                setIsOpen(false);
                break;
        }
    };

    const alignmentClasses = {
        left: 'left-0 origin-top-left',
        right: 'right-0 origin-top-right',
        center: 'left-1/2 -translate-x-1/2 origin-top'
    };

    return (
        <div 
            className={`relative block ${className}`} 
            ref={containerRef}
            onKeyDown={handleKeyDown}
            onBlur={(e) => { if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) { onBlur?.(); } }}
        >
            {/* Trigger */}
            <div onClick={handleToggle} className="cursor-pointer">
                {trigger ? (
                    trigger
                ) : (
                    <button
                        type="button"
                        disabled={disabled}
                        className={`
                            w-full h-14 flex items-center justify-between px-4 rounded-xl border transition-all
                            text-sm font-input-text text-left outline-none
                            ${disabled ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-input-bg'}
                            ${isOpen
                              ? 'border-input-focus ring-4 ring-input-ring'
                              : 'border-input-border shadow-sm shadow-input-shadow hover:border-input-border-hover'
                            }
                        `}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                    >
                        <span className={`truncate mr-2 ${!value ? 'text-input-placeholder font-medium' : 'text-input-text font-input-text'}`}>
                            {displayValue || defaultPlaceholder}
                        </span>
                        <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${isOpen ? 'rotate-180 text-input-icon' : 'text-input-icon/50'}`}>
                            expand_more
                        </span>
                    </button>
                )}
            </div>

            {/* Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: openUpwards ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: openUpwards ? -4 : 4, scale: 1 }}
                        exit={{ opacity: 0, y: openUpwards ? 10 : -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className={`
                            absolute z-50 min-w-[200px] w-max max-w-[320px] bg-dropdown-menu-bg border border-dropdown-menu-border rounded-xl 
                            shadow-xl flex flex-col
                            ${alignmentClasses[align]}
                            ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'}
                            ${menuClassName}
                        `}
                        role="listbox"
                        aria-label={t('common:select_option')}
                    >
                        {/* Search bar */}
                        {searchable && (
                            <div className="px-3.5 py-3 border-b border-dropdown-menu-border flex items-center gap-2.5 shrink-0">
                                <span className="material-symbols-outlined text-lg text-input-icon/50">search</span>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="flex-1 text-sm bg-transparent outline-none text-input-text placeholder:text-input-placeholder font-medium"
                                    placeholder={t('common:search')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setIsOpen(false);
                                        if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
                                            e.stopPropagation();
                                            handleKeyDown(e as any);
                                        }
                                    }}
                                    autoComplete="off"
                                />
                            </div>
                        )}

                        {/* Options */}
                        <div 
                            ref={menuRef}
                            className="overflow-y-auto max-h-60 p-1.5 custom-scrollbar"
                            role="presentation"
                        >
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(option.value)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={`
                                            w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm text-left transition-all
                                            border-b border-slate-100 last:border-0
                                            ${value === option.value || activeIndex === index
                                                ? 'bg-dropdown-option-hover text-input-label font-bold shadow-sm'
                                                : 'text-input-text font-medium hover:bg-dropdown-option-hover'
                                            }
                                        `}
                                        role="option"
                                        aria-selected={value === option.value}
                                    >
                                        {option.icon && (
                                            <span className={`material-symbols-outlined text-lg shrink-0 ${value === option.value || activeIndex === index ? 'text-input-icon' : 'text-input-icon/40'}`}>
                                                {option.icon}
                                            </span>
                                        )}
                                        <span className="truncate flex-1 leading-snug">
                                            {bilingual ? getBilingualLabel(option.label, lang) : (option.label[lang] || option.label.en)}
                                        </span>
                                        {value === option.value && (
                                            <span className="material-symbols-outlined text-lg text-input-icon shrink-0 animate-in zoom-in-50 duration-300">check</span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-xs font-bold text-input-placeholder tracking-wide">
                                        {t('common:no_results')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dropdown;
