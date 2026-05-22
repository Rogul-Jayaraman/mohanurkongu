import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, AlertCircle, ChevronDown, Search, X } from 'lucide-react';
import { TransliteratingTextarea } from '@/components/ui/forms/TransliteratingTextarea';
import { useLanguage } from '@/context/LanguageContext';
import { PROFILE_ACTION_REASONS } from '@/constants/options';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface ReasonDropdownProps {
    value: string;
    onChange: (val: string) => void;
    isTamil: boolean;
}

const ReasonDropdown: React.FC<ReasonDropdownProps> = ({ value, onChange, isTamil }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, showAbove: false });
    const containerRef = useRef<HTMLDivElement>(null);

    const categories = [
        { id: 'VIOLATIONS', label: isTamil ? 'விகிதமீறல்கள்' : 'Violations', color: 'rose', data: PROFILE_ACTION_REASONS.SECURITY, icon: '🔴' },
        { id: 'SYSTEM', label: isTamil ? 'அமைப்பு' : 'System', color: 'amber', data: PROFILE_ACTION_REASONS.QUALITY, icon: '🟡' },
        { id: 'EXIT', label: isTamil ? 'பயனர் விலகல்' : 'User Exit', color: 'emerald', data: PROFILE_ACTION_REASONS.SUCCESS, icon: '🟢' }
    ];

    const currentOption = [...PROFILE_ACTION_REASONS.SECURITY, ...PROFILE_ACTION_REASONS.QUALITY, ...PROFILE_ACTION_REASONS.SUCCESS].find(opt => opt.value === value) || (value === 'OTHER' ? { value: 'OTHER', label: 'User Other', labelTa: 'பயனர் மற்றவை' } : null);

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const MENU_HEIGHT = 380;
            const spaceBelow = window.innerHeight - rect.bottom;
            const showAbove = spaceBelow < MENU_HEIGHT && rect.top > spaceBelow;
            setCoords({
                top: showAbove ? rect.top + window.scrollY - 10 : rect.bottom + window.scrollY + 10,
                left: rect.left + window.scrollX,
                width: rect.width,
                showAbove
            });
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            updateCoords();
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (isOpen && e.target instanceof HTMLElement && !e.target.closest('.dropdown-scrollable-content')) {
                setIsOpen(false);
            }
        };
        const handleResize = () => {
            if (isOpen) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { capture: true });
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                const target = e.target as HTMLElement;
                if (target.closest('.dropdown-portal-menu')) return;
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const filteredCategories = categories.map(cat => ({
        ...cat,
        data: cat.data.filter(item => {
            const query = searchQuery.toLowerCase();
            return item.label.toLowerCase().includes(query) || item.labelTa.includes(query);
        })
    })).filter(cat => cat.data.length > 0 || (searchQuery === '' && cat.id === 'OTHER'));

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: coords.showAbove ? 10 : -10, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: coords.showAbove ? 10 : -10, scale: 0.95, filter: 'blur(10px)' }}
                    style={{
                        position: 'fixed',
                        top: coords.showAbove ? (coords.top - window.scrollY - 350) : (coords.top - window.scrollY),
                        left: coords.left - window.scrollX,
                        width: coords.width,
                        zIndex: 9999
                    }}
                    className="dropdown-portal-menu bg-white/95 backdrop-blur-2xl rounded-xl shadow-[0_30px_90px_rgba(139,0,0,0.3)] border border-gold/30 overflow-hidden flex flex-col max-h-[350px] ring-1 ring-black/10 origin-bottom"
                >
                    <div className="p-4 bg-ivory/50 border-b border-gold/10 flex items-center gap-2 group transition-colors focus-within:bg-ivory/70 shrink-0">
                        <Search size={14} className="text-rosewood/40 group-focus-within:text-rosewood transition-colors" />
                        <input
                            type="text"
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none text-sm text-rosewood placeholder:text-gold-soft font-bold"
                            placeholder={isTamil ? 'தேடு...' : 'Search...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="dropdown-scrollable-content flex-1 overflow-y-auto py-3 custom-scrollbar overscroll-contain">
                        {filteredCategories.map(cat => (
                            <div key={cat.id} className="mb-3 last:mb-0">
                                <div className="px-1.5 space-y-0.5">
                                    {cat.data.map(item => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(item.value);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-6 py-2.5 text-sm transition-all rounded-xl flex items-center justify-between group
                                                ${value === item.value
                                                    ? 'bg-rosewood/5 text-rosewood shadow-sm ring-1 ring-rosewood/10'
                                                    : 'text-slate-600 hover:bg-ivory/80 hover:text-rosewood hover:translate-x-1'}`}
                                        >
                                            <span className="truncate">{isTamil ? item.labelTa : item.label}</span>
                                            {value === item.value && (
                                                <div className="w-1.5 h-1.5 rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(!searchQuery || 'user other'.includes(searchQuery.toLowerCase())) && (
                            <div className="mt-2 pt-2 border-t border-gold/10 px-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('OTHER');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-6 py-3 text-sm transition-all rounded-xl flex items-center gap-3
                                        ${value === 'OTHER'
                                            ? 'bg-rosewood/5 text-rosewood font-black ring-1 ring-rosewood/10'
                                            : 'text-slate-500 hover:bg-ivory/80 hover:text-rosewood hover:translate-x-1'}`}
                                >
                                    <AlertCircle size={14} className={value === 'OTHER' ? 'text-rosewood' : 'text-gold/40'} />
                                    <span>{isTamil ? 'பயனர் மற்றவை' : 'User Other'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={handleToggle}
                className={`w-full flex items-center justify-between px-5 py-4 bg-linear-to-br from-ivory/80 to-white border-2 rounded-xl text-sm transition-all shadow-sm
                    ${isOpen
                        ? 'border-rosewood ring-8 ring-rosewood/5 shadow-md'
                        : 'border-gold/20 hover:border-gold/40 hover:shadow-md'}`}
            >
                <div className="flex items-center gap-3 truncate">
                    {currentOption ? (
                        <span className="truncate font-bold text-slate-700 text-sm tracking-tight">
                            {isTamil ? currentOption.labelTa : currentOption.label}
                        </span>
                    ) : (
                        <span className="text-slate-400 font-medium">
                            {isTamil ? 'காரணத்தைத் தேர்ந்தெடுக்கவும்...' : 'Select a reason...'}
                        </span>
                    )}
                </div>
                <div className={`transition-all duration-500 ease-out ${isOpen ? 'rotate-180 text-rosewood scale-125' : 'text-gold'}`}>
                    <ChevronDown size={20} strokeWidth={2.5} />
                </div>
            </button>
            {createPortal(menuContent, document.body)}
        </div>
    );
};

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, reasonTa: string) => void;
    title?: string;
    description?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    placeholder,
    confirmLabel,
    cancelLabel
}) => {
    const { language, t } = useLanguage();
    const isTamil = language === 'ta';

    const defaultTitle = isTamil ? "நிராகரிப்பு முடிவு" : "Reject Decision";
    const defaultDescription = isTamil
        ? "தயவுசெய்து இந்த நிராகரிப்பிற்கான தெளிவான காரணத்தை வழங்கவும். இது பயனருக்கு சிக்கலை சரிசெய்ய உதவும்."
        : "Please provide a clear reason for this rejection. This will be shared with the user to help them correct the issue.";
    const defaultPlaceholder = isTamil
        ? "எ.கா., புகைப்படங்கள் மங்கலான, தவறான அடையாள விவரங்கள் போன்றவை..."
        : "e.g., Photos are blurred, Invalid ID details, etc...";
    const defaultConfirm = isTamil ? "உறுதிப்படுத்து" : "Confirm";
    const defaultCancel = isTamil ? "ரத்து செய்" : "Cancel";

    const displayTitle = title || defaultTitle;
    const displayDescription = description || defaultDescription;
    const displayPlaceholder = placeholder || defaultPlaceholder;
    const displayConfirm = confirmLabel || defaultConfirm;
    const displayCancel = cancelLabel || defaultCancel;
    const [reason, setReason] = useState('');
    const [reasonTa, setReasonTa] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setReason('');
            setReasonTa('');
            setSelectedOption('');
        } else {
            document.body.style.overflow = 'unset';
            scrollToTop();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim() || selectedOption) {
            let rEn = isTamil ? reasonTa : reason;
            let rTa = isTamil ? reason : reasonTa;
            onConfirm((rEn || '').trim(), (rTa || rEn || '').trim());
            setReason('');
            setReasonTa('');
        }
    };

    const handleReasonChange = (val: string) => {
        setSelectedOption(val);
        if (val === 'OTHER') {
            setReason('');
            setReasonTa('');
            return;
        }
        let found: any = null;
        Object.values(PROFILE_ACTION_REASONS).forEach(group => {
            const match = group.find(r => r.value === val);
            if (match) found = match;
        });
        if (found) {
            setReason(isTamil ? found.labelTa : found.label);
            setReasonTa(isTamil ? found.label : found.labelTa);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onClose()}
                        className="absolute inset-0 bg-linear-to-br from-ivory/40 via-gold-soft/20 to-ivory/40 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl overflow-hidden pointer-events-none" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
                        <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-6 py-4 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="shrink-0">
                                        <div className="p-2 bg-linear-to-br from-rosewood/10 to-rosewood/5 rounded-xl">
                                            <XCircle className="text-rose-600" size={20} />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-black text-rosewood tracking-tight truncate leading-tight">
                                            {displayTitle}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 bg-rosewood-gradient text-white rounded-full transition-all hover:brightness-110 hover:rotate-90 duration-300 ml-2 shrink-0 shadow-md"
                                    aria-label="Close modal"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <p className="text-sm text-rosewood/60 font-medium leading-relaxed">
                                        {displayDescription}
                                    </p>
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
                                            {isTamil ? 'காரணத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Reason'}
                                        </label>
                                        <ReasonDropdown
                                            value={selectedOption}
                                            onChange={handleReasonChange}
                                            isTamil={isTamil}
                                        />
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {selectedOption === 'OTHER' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-4 overflow-hidden pt-2"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
                                                            {isTamil ? 'காரணம்' : 'Reason'}
                                                        </label>
                                                    </div>
                                                    <TransliteratingTextarea
                                                        value={reason}
                                                        onValueChange={setReason}
                                                        placeholder={displayPlaceholder}
                                                        targetLanguage={isTamil ? 'ta' : 'en'}
                                                        className="w-full bg-linear-to-br from-ivory/80 to-white border-2 border-gold/20 focus:border-gold/40 hover:border-gold/30 rounded-xl p-5 text-sm text-slate-800 outline-none transition-all shadow-sm focus:shadow-lg resize-none leading-relaxed font-medium"
                                                    />
                                                </div>
                                                <div className="p-4 bg-linear-to-br from-ivory/50 to-white border border-gold/10 rounded-xl space-y-2">
                                                    <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest">
                                                        {isTamil ? 'விளக்கம்' : 'Preview'}
                                                    </label>
                                                    <div className="min-h-6 text-sm text-rosewood font-medium leading-relaxed">
                                                        {reasonTa || <span className="opacity-20 italic">...</span>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="px-6 py-5 backdrop-blur-xl border-t border-gold/10 shrink-0">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 rounded-xl bg-rosewood-gradient border-2 border-gold/20 text-rosewood font-bold text-sm hover:shadow-md hover:border-gold/40 transition-all shadow-sm"
                                    >
                                        {displayCancel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); handleSubmit(e as any); }}
                                        disabled={!selectedOption || (selectedOption === 'OTHER' && !reason.trim())}
                                        className="flex-1 px-4 py-3 rounded-xl bg-linear-to-br from-gold/30 via-ivory to-gold/30 text-rosewood font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {displayConfirm}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
