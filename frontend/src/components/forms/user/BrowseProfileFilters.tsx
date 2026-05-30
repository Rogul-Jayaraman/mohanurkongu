import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DISTRICTS, TALUKS_BY_DISTRICT, DISTRICT_TAMIL, TALUK_TAMIL } from '@/constants/locations';
import {
    RASI_OPTIONS,
    NAKSHATRA_OPTIONS,
    DOSHAM_OPTIONS,
    MARITAL_STATUS_OPTIONS,
    DIET_OPTIONS,
    COMPLEXION_OPTIONS,
    JOB_SECTOR_OPTIONS,
    RESIDENCE_OPTIONS,
    KULAM_OPTIONS
} from '@/constants/options';
import Dropdown, { type DropdownOption } from '@/components/ui/forms/Dropdown';
import MultiSelect from '@/components/ui/forms/MultiSelect';
import { Input } from '@/components/ui/forms/Input';
import RangeSlider from '@/components/ui/forms/RangeSlider';

// ═══════════════════════════════════════════════════════════
// FilterGroup
// ═══════════════════════════════════════════════════════════
interface FilterGroupProps {
    title: string;
    titleTa: string;
    icon?: string;
    defaultOpen?: boolean;
    isHighlighted?: boolean;
    children: React.ReactNode;
    count?: number;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({ title, titleTa, icon, defaultOpen = false, isHighlighted = false, children, count = 0 }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`border-b border-gold/10 last:border-0 overflow-hidden transition-all duration-500 ${isHighlighted ? 'bg-gold/10' : 'bg-transparent'}`}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-6 py-4.5 text-left outline-none hover:bg-white/40 transition-all duration-300 group">
                <div className="flex items-center gap-4">
                    {icon && (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 shadow-[0_8px_20px_rgba(107,0,40,0.2)]' : 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)]'} border border-gold/20 group-hover:scale-110`}>
                            <span className={`material-symbols-outlined text-lg transition-colors duration-500 ${isOpen ? 'text-white' : 'text-rosewood/60 group-hover:text-rosewood'}`}>{icon}</span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className={`text-[13px] font-black tracking-tight uppercase transition-colors duration-300 font-serif ${isHighlighted ? 'text-rosewood' : 'text-slate-800'}`}>{title}</span>
                        <span className={`text-[9px] font-bold uppercase transition-colors duration-300 tracking-widest ${isHighlighted ? 'text-rosewood/70' : 'text-rosewood/30'} -mt-0.5`}>{titleTa}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {count > 0 && (
                        <div className="relative">
                            <span className="bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md min-w-5 text-center block shadow-[0_2px_8px_rgba(107,0,40,0.3)]">{count}</span>
                        </div>
                    )}
                    <span className={`material-symbols-outlined transition-all duration-500 text-gold ${isOpen ? 'rotate-180 opacity-100 scale-110' : 'opacity-40 group-hover:opacity-100'}`}>{isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                </div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}>
                        <div className="px-5.pb-5 pt-1 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// CascadingDropdown
// ═══════════════════════════════════════════════════════════
interface CascadingDropdownProps {
    districtValue: string;
    talukValue: string;
    onDistrictChange: (val: string) => void;
    onTalukChange: (val: string) => void;
    labels: { district: { en: string; ta: string }; taluk: { en: string; ta: string } };
}

export const CascadingDropdown: React.FC<CascadingDropdownProps> = ({ districtValue, talukValue, onDistrictChange, onTalukChange, labels }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language as 'en' | 'ta';

    const districtOptions = useMemo(() => {
        const options: DropdownOption[] = DISTRICTS.map((d: string) => ({
            value: d, label: { en: d, ta: DISTRICT_TAMIL[d] || d }
        }));
        return [{ value: '', label: { en: 'Any District', ta: 'அனைத்து மாவட்டங்கள்' } }, ...options];
    }, []);

    const talukOptions = useMemo(() => {
        if (!districtValue || !TALUKS_BY_DISTRICT[districtValue]) {
            return [{ value: '', label: { en: 'Select District First', ta: 'முதலில் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்' } }];
        }
        const options: DropdownOption[] = TALUKS_BY_DISTRICT[districtValue].map((t: string) => ({
            value: t, label: { en: t, ta: TALUK_TAMIL[t] || t }
        }));
        return [{ value: '', label: { en: 'Any Taluk', ta: 'அனைத்து தாலுகாக்கள்' } }, ...options];
    }, [districtValue]);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex flex-col ml-1">
                    <span className="text-[10px] font-black tracking-widest text-rosewood/40 uppercase">{labels.district.en}</span>
                    <span className="text-[9px] font-bold text-rosewood/30 uppercase leading-none">{labels.district.ta}</span>
                </div>
                <Dropdown options={districtOptions} value={districtValue} onChange={(val: string) => { onDistrictChange(val); onTalukChange(''); }} searchable className="w-full" menuClassName="w-full" />
            </div>
            <div className={`space-y-2 transition-all duration-500 ${!districtValue ? 'opacity-50 grayscale pointer-events-none scale-[0.98]' : 'opacity-100 scale-100'}`}>
                <div className="flex flex-col ml-1">
                    <span className="text-[10px] font-black tracking-widest text-rosewood/40 uppercase">{labels.taluk.en}</span>
                    <span className="text-[9px] font-bold text-rosewood/30 uppercase leading-none">{labels.taluk.ta}</span>
                </div>
                <Dropdown options={talukOptions} value={talukValue} onChange={onTalukChange} searchable disabled={!districtValue} className="w-full" menuClassName="w-full" />
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// MultiSelectDropdown
// ═══════════════════════════════════════════════════════════
interface MultiSelectOption {
    value: string;
    label: string;
    labelTa: string;
}

interface MultiSelectDropdownProps {
    options: MultiSelectOption[];
    values: string[];
    onChange: (values: string[]) => void;
    label: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, values, onChange, label, placeholder, error, disabled = false }) => {
    const { t, i18n } = useTranslation(['common']);
    const lang = i18n.language as 'en' | 'ta';
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt => {
        const query = searchQuery.toLowerCase();
        return opt.label.toLowerCase().includes(query) || opt.labelTa.toLowerCase().includes(query);
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleOption = (val: string) => {
        const newValues = values.includes(val) ? values.filter(v => v !== val) : [...values, val];
        onChange(newValues);
    };

    const defaultPlaceholder = placeholder || t('common:select_option');

    return (
        <div className="space-y-1.5 relative w-full" ref={containerRef}>
            <label className="flex gap-1 items-center text-xs font-black tracking-wider text-rosewood/70 ml-1">{label}</label>
            <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`min-h-[48px] w-full px-4 py-2 bg-white border rounded-xl cursor-pointer flex flex-wrap items-center gap-2 transition-all duration-300 shadow-sm shadow-black/2 ${disabled ? 'bg-slate-50 cursor-not-allowed text-slate-400' : ''} ${error ? 'border-rose-300 ring-4 ring-rose-500/5' : isOpen ? 'border-rosewood ring-4 ring-rosewood/5' : 'border-slate-200 hover:border-gold-soft/50'}`}>
                {values.length === 0 ? (
                    <span className="text-sm text-slate-400 font-normal">{defaultPlaceholder}</span>
                ) : (
                    <div className="flex flex-wrap gap-1.5 py-1">
                        {values.map(v => {
                            const opt = options.find(o => o.value === v);
                            return (
                                <span key={v} className="bg-rosewood/5 text-rosewood text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-rosewood/10">
                                    <span>{opt?.[lang === 'ta' ? 'labelTa' : 'label']}</span>
                                    <button onClick={(e) => { e.stopPropagation(); toggleOption(v); }} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-rosewood/10 transition-colors">
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}
                <div className="ml-auto pl-2 flex items-center">
                    <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${isOpen ? 'rotate-180 text-rosewood' : 'text-slate-400'}`}>expand_more</span>
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 4, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} className="absolute z-50 top-full w-full bg-white border border-gold-soft/20 rounded-xl shadow-2xl shadow-black/15 flex flex-col max-h-[300px] ring-1 ring-black/5 overflow-hidden">
                        <div className="p-3 bg-ivory/30 border-b border-slate-100 flex items-center gap-2 group">
                            <span className="material-symbols-outlined text-rosewood/50 group-focus-within:text-rosewood transition-colors">search</span>
                            <input type="text" className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-gold-soft font-medium" placeholder={t('common:search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
                            {filteredOptions.length > 0 ? filteredOptions.map(opt => {
                                const isSelected = values.includes(opt.value);
                                return (
                                    <button key={opt.value} type="button" onClick={() => toggleOption(opt.value)} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all outline-none ${isSelected ? 'bg-rosewood/5 text-rosewood font-black' : 'text-slate-600 hover:bg-gold-soft/5 hover:text-rosewood font-medium'}`}>
                                        <span className="truncate flex-1">{opt[lang === 'ta' ? 'labelTa' : 'label']}</span>
                                        <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-rosewood' : 'text-gold/20'}`}>{isSelected ? 'check_circle' : 'radio_button_unchecked'}</span>
                                    </button>
                                );
                            }) : (
                                <div className="px-4 py-8 text-center bg-slate-50/30">
                                    <p className="text-xs font-bold text-slate-400 tracking-wider lowercase">{t('common:no_results')}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// ActiveFilterChips
// ═══════════════════════════════════════════════════════════
interface ActiveFilterChipsProps {
    filters: any;
    onClear: (key: string) => void;
    onClearAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({ filters, onClear, onClearAll }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language as 'en' | 'ta';

    const toTitleCase = (str: string) => str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const getChipLabel = (key: string, value: any) => {
        if (value === undefined || value === null || value === '') return null;
        switch (key) {
            case 'currentDistrict':
            case 'nativeDistrict':
                return { en: toTitleCase(String(value)), ta: DISTRICT_TAMIL[value] || value, category: key === 'currentDistrict' ? 'Current District' : 'Native District' };
            case 'currentCity':
            case 'currentTaluk':
                return { en: toTitleCase(String(value)), ta: TALUK_TAMIL[value] || value, category: 'Taluk' };
            case 'kulam': {
                const k = KULAM_OPTIONS.find((o: any) => o.value === value);
                return { en: k?.label || value, ta: k?.labelTa || value, category: 'Kulam' };
            }
            case 'rasi': {
                const r = RASI_OPTIONS.find((o: any) => o.value === value);
                return { en: r?.label || value, ta: r?.labelTa || value, category: 'Rasi' };
            }
            case 'nakshatra': {
                const n = NAKSHATRA_OPTIONS.find((o: any) => o.value === value);
                return { en: n?.label || value, ta: n?.labelTa || value, category: 'Star' };
            }
            case 'laganam': {
                const l = RASI_OPTIONS.find((o: any) => o.value === value);
                return { en: l?.label || value, ta: l?.labelTa || value, category: 'Lagnam' };
            }
            case 'dosham': {
                const d = DOSHAM_OPTIONS.find((o: any) => o.value === value);
                return { en: d?.label || value, ta: d?.labelTa || value, category: 'Dosham' };
            }
            case 'maritalStatus': {
                const m = MARITAL_STATUS_OPTIONS.find((o: any) => o.value === value);
                return { en: m?.label || value, ta: m?.labelTa || value, category: 'Status' };
            }
            case 'diet': {
                const d = DIET_OPTIONS.find((o: any) => o.value === value);
                return { en: d?.label || value, ta: d?.labelTa || value, category: 'Diet' };
            }
            case 'complexion': {
                const c = COMPLEXION_OPTIONS.find((o: any) => o.value === value);
                return { en: c?.label || value, ta: c?.labelTa || value, category: 'Complexion' };
            }
            case 'residence': {
                const r = RESIDENCE_OPTIONS.find((o: any) => o.value === value);
                return { en: r?.label || value, ta: r?.labelTa || value, category: 'Residence' };
            }
            case 'currentSector':
            case 'jobSector': {
                const j = JOB_SECTOR_OPTIONS.find((o: any) => o.value === value);
                return { en: j?.label || value, ta: j?.labelTa || value, category: 'Job Sector' };
            }
            case 'education':
                return { en: toTitleCase(String(value)), ta: value, category: 'Education' };
            case 'jobTitle':
                return { en: toTitleCase(String(value)), ta: value, category: 'Job Title' };
            case 'jobLocation':
                return { en: toTitleCase(String(value)), ta: value, category: 'Job Location' };
            case 'kuladeivam':
                return { en: toTitleCase(String(value)), ta: value, category: 'Kuladeivam' };
            case 'minAge':
            case 'maxAge':
                return { en: `${value} yrs`, ta: `${value} ஆண்டுகள்`, category: key === 'minAge' ? 'Min Age' : 'Max Age' };
            case 'minHeight':
            case 'maxHeight':
                return { en: `${value} cm`, ta: `${value} செ.மீ`, category: key === 'minHeight' ? 'Min Height' : 'Max Height' };
            case 'minWeight':
            case 'maxWeight':
                return { en: `${value} kg`, ta: `${value} கி.கி`, category: key === 'minWeight' ? 'Min Weight' : 'Max Weight' };
            case 'minSalary':
            case 'maxSalary':
                return { en: `₹${value} L`, ta: `₹${value} இலட்சம்`, category: key === 'minSalary' ? 'Min Salary' : 'Max Salary' };
            default:
                return null;
        }
    };

    const activeKeys = Object.keys(filters).filter(key => {
        const val = filters[key];
        if (val === undefined || val === null || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        if (key === 'sort') return false;
        return true;
    });

    if (activeKeys.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2.5 py-4">
            {activeKeys.map(key => {
                const info = getChipLabel(key, filters[key]);
                if (!info) return null;
                return (
                    <div key={key} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white/40 backdrop-blur-md border border-gold/20 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] animate-in zoom-in-75 duration-500 hover:border-gold transition-all group">
                        <div className="flex flex-col -space-y-1">
                            <span className="text-[8px] font-black text-rosewood/30 uppercase tracking-widest">{info.category}</span>
                            <span className="text-[12px] font-black text-rosewood tracking-tight">{info[lang === 'ta' ? 'ta' : 'en']}</span>
                        </div>
                        <button onClick={() => onClear(key)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 text-rosewood/40 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-rosewood/20 hover:scale-110">
                            <span className="material-symbols-outlined text-[14px] font-black">close</span>
                        </button>
                    </div>
                );
            })}
            <button onClick={onClearAll} className="text-[10px] font-black text-rosewood/40 hover:text-rosewood px-4 py-2 rounded-xl border border-dashed border-rosewood/10 hover:border-rosewood/30 hover:bg-rosewood/5 transition-all duration-500 uppercase tracking-widest">
                {lang === 'ta' ? 'அனைத்தையும் நீக்கு' : 'Reset Filters'}
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// BrowseProfileFilters (Full-Screen Drawer Form)
// ═══════════════════════════════════════════════════════════
interface BrowseProfileFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: any;
    setFilters: (filters: any) => void;
    onApply: () => void;
    searchLevel?: string;
}

const LockedOverlay: React.FC<{ message: string; messageTa: string }> = ({ message, messageTa }) => {
    const { i18n } = useTranslation();
    const isTamil = i18n.language === 'ta';
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ivory/80 backdrop-blur-[2px] rounded-xl">
            <div className="w-14 h-14 rounded-full bg-rosewood/5 flex items-center justify-center mb-4 border border-rosewood/10">
                <span className="material-symbols-outlined text-3xl text-rosewood/40">lock</span>
            </div>
            <p className="text-xs font-bold text-rosewood/50 text-center max-w-[200px] leading-relaxed">
                {isTamil ? messageTa : message}
            </p>
        </div>
    );
};

export const BrowseProfileFilters: React.FC<BrowseProfileFiltersProps> = ({ isOpen, onClose, filters, setFilters, onApply, searchLevel = 'BASIC' }) => {
    const { t, i18n } = useTranslation(['dashboard', 'common', 'browse']);
    const [localFilters, setLocalFilters] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters || {});
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, filters]);

    const handleChange = (key: string, value: any) => {
        setLocalFilters((prev: any) => {
            const updated = { ...prev, [key]: value };
            if (value === '' || value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
                delete updated[key];
            }
            return updated;
        });
    };

    const handleApply = () => { setFilters(localFilters); onApply(); };
    const handleClearAll = () => { setLocalFilters({}); };
    const handleReset = () => { setLocalFilters({}); setFilters({}); onApply(); };

    // Search level gating
    const levels = ['BASIC', 'EXTENDED', 'ADVANCED', 'FULL'];
    const isAtLeast = (min: string) => levels.indexOf(searchLevel) >= levels.indexOf(min);
    const astrologyLocked = !isAtLeast('ADVANCED');
    const educationLocked = !isAtLeast('EXTENDED');
    const residenceLocked = !isAtLeast('FULL');

    const activeCount = Object.keys(localFilters).filter(k => {
        const v = localFilters[k];
        return v !== '' && v !== undefined && v !== null && v !== false;
    }).length;

    const toTitleCase = (str: string) => str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const districtOptions: DropdownOption[] = DISTRICTS.map(d => ({
        value: d, label: { en: toTitleCase(d), ta: (DISTRICT_TAMIL as any)[d] || d }
    }));
    const getTalukOptions = (district: string): DropdownOption[] =>
        ((TALUKS_BY_DISTRICT as any)[district] || []).map((t: string) => ({
            value: t, label: { en: toTitleCase(t), ta: (TALUK_TAMIL as any)[t] || t }
        }));
    const rasiOpts: DropdownOption[] = RASI_OPTIONS.map(r => ({ value: r.value, label: { en: r.label, ta: r.labelTa } }));
    const nakshatraOpts: DropdownOption[] = NAKSHATRA_OPTIONS.map(n => ({ value: n.value, label: { en: n.label, ta: n.labelTa } }));
    const doshamOpts: DropdownOption[] = DOSHAM_OPTIONS.map(d => ({ value: d.value, label: { en: d.label, ta: d.labelTa } }));
    const complexionOpts: DropdownOption[] = COMPLEXION_OPTIONS.map(c => ({ value: c.value, label: { en: c.label, ta: c.labelTa } }));
    const dietOpts: DropdownOption[] = DIET_OPTIONS.map(d => ({ value: d.value, label: { en: d.label, ta: d.labelTa } }));
    const maritalStatusOpts: DropdownOption[] = MARITAL_STATUS_OPTIONS.map(m => ({ value: m.value, label: { en: m.label, ta: m.labelTa } }));
    const jobSectorOpts: DropdownOption[] = JOB_SECTOR_OPTIONS.map(j => ({ value: j.value, label: { en: j.label, ta: j.labelTa } }));
    const residenceOpts: DropdownOption[] = RESIDENCE_OPTIONS.map(r => ({ value: r.value, label: { en: r.label, ta: r.labelTa } }));

    const kulamMultiOpts = KULAM_OPTIONS.map((k: any) => {
        const labelEn = typeof k.label === 'string' ? k.label : k.label.en;
        const labelTa = typeof k.label === 'string' ? k.label : (k.label.ta || '');
        return { value: k.value, label: { en: labelEn, ta: labelTa } };
    });
    const kulamDropdownOpts: DropdownOption[] = kulamMultiOpts.map((k: any) => ({
        value: k.value, label: k.label
    }));

    const SectionCard = ({
        icon, title, titleTa, children, isHighlight = false, columns = 2, spanClassName = '', locked = false, lockedMessage = '', lockedMessageTa = ''
    }: {
        icon: string; title: string; titleTa: string;
        children: React.ReactNode; isHighlight?: boolean;
        columns?: 1 | 2 | 3;
        spanClassName?: string;
        locked?: boolean;
        lockedMessage?: string;
        lockedMessageTa?: string;
    }) => {
        return (
            <div className={`transition-all duration-300 rounded-xl h-full flex flex-col relative group/section ${spanClassName} ${
                isHighlight
                    ? 'bg-white border-2 border-gold/30 shadow-lg shadow-gold/5'
                    : 'bg-white border border-gold-soft/10 shadow-sm hover:shadow-lg hover:shadow-black/5'
            } focus-within:z-60 hover:z-20`}>
                <div className="w-full flex items-center justify-between px-6 py-4 bg-ivory/50 border-b border-gold-soft/10 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 text-white shadow-md">
                            <span className="material-symbols-outlined text-lg!">{icon}</span>
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[11px] font-black tracking-[0.18em] text-rosewood uppercase">{title}</h3>
                            </div>
                            <span className="text-[9px] font-bold text-rosewood/30 uppercase mt-0.5 tracking-widest">{titleTa}</span>
                        </div>
                    </div>
                </div>
                <div className={`px-6 py-8 gap-x-8 gap-y-8 flex-1 relative ${
                    columns === 1 ? 'flex flex-col' :
                    columns === 2 ? 'grid grid-cols-1 md:grid-cols-2' :
                    'grid grid-cols-1 md:grid-cols-3'
                }`}>
                    {children}
                    {locked && <LockedOverlay message={lockedMessage} messageTa={lockedMessageTa} />}
                </div>
            </div>
        );
    };

    const FilterDropdown = ({ label, options, value, onChange, placeholder, bilingual }: {
        label: string; options: DropdownOption[]; value: string; onChange: (v: string) => void; placeholder?: string; bilingual?: boolean
    }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-rosewood/50 uppercase tracking-[0.2em] ml-1">{label}</label>
            <Dropdown
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder || t('common:select_option')}
                searchable={options.length > 8}
                bilingual={bilingual}
                className="w-full"
                menuClassName="min-w-[280px]"
            />
        </div>
    );

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ivory" />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                        className="relative w-full h-full bg-ivory flex flex-col overflow-hidden kolam-bg"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                            <div className="ornament-corner scale-150 origin-top-right translate-x-4 -translate-y-4" />
                        </div>
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rosewood/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

                        <div className="shrink-0 relative z-100 px-6 lg:px-12 py-5 bg-white/80 backdrop-blur-2xl border-b border-gold/10 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-5">
                                <div className="size-11 rounded-xl bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 flex items-center justify-center shadow-lg shadow-rosewood/20 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gold/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <span className="material-symbols-outlined text-white text-2xl! relative z-10">tune</span>
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-rosewood tracking-tight leading-none italic">{t('browse:advanced_filters')}</h2>
                                    <span className="text-[10px] font-bold text-rosewood/40 uppercase tracking-[0.25em] mt-2">{t('browse:filters_subtitle')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white text-rosewood shadow-sm border border-gold/20 hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white transition-all duration-300 group" aria-label="Close filters">
                                    <span className="material-symbols-outlined text-2xl! group-hover:rotate-90 transition-transform duration-500">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto filter-scroll-container custom-scrollbar relative z-10 bg-slate-50/30">
                            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                <SectionCard icon="auto_awesome" title={t('browse:section_astrology')} titleTa="ஜோதிடம்" isHighlight columns={1} spanClassName=""
                                    locked={astrologyLocked}
                                    lockedMessage={t('browse:filters.locked.astrology', 'Upgrade to Gold to access horoscope filters')}
                                    lockedMessageTa="ஜாதக வடிப்பான்களை அணுக தங்கத் திட்டத்திற்கு மேம்படுத்தவும்"
                                >
                                    <FilterDropdown label={t('browse:rasi')} bilingual options={rasiOpts} value={localFilters.rasi || ''} onChange={v => handleChange('rasi', v)} />
                                    <FilterDropdown label={t('browse:nakshatra')} bilingual options={nakshatraOpts} value={localFilters.nakshatra || ''} onChange={v => handleChange('nakshatra', v)} />
                                    <FilterDropdown label={t('browse:laganam')} bilingual options={rasiOpts} value={localFilters.laganam || ''} onChange={v => handleChange('laganam', v)} />
                                    <FilterDropdown label={t('browse:dosham')} options={doshamOpts} value={localFilters.dosham || ''} onChange={v => handleChange('dosham', v)} />
                                </SectionCard>

                                <SectionCard icon="location_on" title={t('browse:section_location')} titleTa="இருப்பிடம்" columns={1} spanClassName="">
                                    <FilterDropdown label={t('browse:current_district')} options={districtOptions} value={localFilters.currentDistrict || ''} onChange={v => { handleChange('currentDistrict', v); handleChange('currentCity', ''); }} />
                                    <FilterDropdown label={t('browse:city_taluk')} options={localFilters.currentDistrict ? getTalukOptions(localFilters.currentDistrict) : []} value={localFilters.currentCity || ''} onChange={v => handleChange('currentCity', v)} placeholder={t('browse:select_taluk', 'Select Taluk')} />
                                    <div className="relative">
                                        {residenceLocked && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-xl text-rosewood/30">lock</span>
                                                    <span className="text-[9px] font-bold text-rosewood/40 text-center">
                                                        {i18n.language === 'ta' ? 'பிளாட்டினத்தில் மட்டும்' : 'Available in Platinum'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <FilterDropdown label={t('browse:residence')} options={residenceOpts} value={localFilters.residence || ''} onChange={v => handleChange('residence', v)} />
                                    </div>
                                    <div className="">
                                        <RangeSlider min={-15} max={15} value={[localFilters.minAgeDiff !== undefined && localFilters.minAgeDiff !== '' ? Number(localFilters.minAgeDiff) : -5, localFilters.maxAgeDiff !== undefined && localFilters.maxAgeDiff !== '' ? Number(localFilters.maxAgeDiff) : 5]} onChange={(val: number[]) => { handleChange('minAgeDiff', val[0]); handleChange('maxAgeDiff', val[1]); }} label={t('browse:age_diff')} />
                                    </div>
                                </SectionCard>

                                <SectionCard icon="temple_hindu" title={t('browse:section_community')} titleTa="சமூகம்" columns={1} spanClassName="">
                                    <FilterDropdown label={t('browse:kulam')} options={kulamDropdownOpts} value={localFilters.kulam || ''} onChange={v => handleChange('kulam', v)} />
                                    <Input label={t('browse:kuladeivam')} icon="temple_hindu" name="kuladeivam" placeholder={t('browse:type_name_placeholder', 'Type name...')} value={localFilters.kuladeivam || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('kuladeivam', e.target.value)} className="h-14" />
                                    <div className="pt-4">
                                        <MultiSelect options={kulamMultiOpts} values={localFilters.kulamAvoid || []} onChange={(vals: string[]) => handleChange('kulamAvoid', vals)} label={t('browse:kulam_avoid')} placeholder={t('browse:select_kulam_avoid', 'Select Kulam to avoid...')} />
                                    </div>
                                </SectionCard>

                                <SectionCard icon="person" title={t('browse:section_physical')} titleTa="உடல் மற்றும் சுயவிவரம்" columns={1} spanClassName="">
                                    <div className="">
                                        <RangeSlider min={18} max={60} value={[Number(localFilters.minAge) || 18, Number(localFilters.maxAge) || 60]} onChange={(val: number[]) => { handleChange('minAge', val[0]); handleChange('maxAge', val[1]); }} label={t('browse:age_range')} />
                                    </div>
                                    <div className="">
                                        <RangeSlider min={140} max={210} unit="cm" value={[Number(localFilters.minHeight) || 140, Number(localFilters.maxHeight) || 210]} onChange={(val: number[]) => { handleChange('minHeight', val[0]); handleChange('maxHeight', val[1]); }} label={t('browse:height_range')} />
                                    </div>
                                    <div className="">
                                        <RangeSlider min={30} max={150} unit="kg" value={[Number(localFilters.minWeight) || 30, Number(localFilters.maxWeight) || 150]} onChange={(val: number[]) => { handleChange('minWeight', val[0]); handleChange('maxWeight', val[1]); }} label={t('browse:weight_range')} />
                                    </div>
                                    <FilterDropdown label={t('browse:marital_status')} options={maritalStatusOpts} value={localFilters.maritalStatus || ''} onChange={v => handleChange('maritalStatus', v)} />
                                    <FilterDropdown label={t('browse:complexion')} options={complexionOpts} value={localFilters.complexion || ''} onChange={v => handleChange('complexion', v)} />
                                    <FilterDropdown label={t('browse:diet')} options={dietOpts} value={localFilters.diet || ''} onChange={v => handleChange('diet', v)} />
                                </SectionCard>

                                <SectionCard icon="school" title={t('browse:section_education')} titleTa="கல்வி மற்றும் பணி" columns={2} spanClassName="md:col-span-2"
                                    locked={educationLocked}
                                    lockedMessage={t('browse:filters.locked.education', 'Upgrade to Silver to access education & career filters')}
                                    lockedMessageTa="கல்வி மற்றும் பணி வடிப்பான்களை அணுக வெள்ளித் திட்டத்திற்கு மேம்படுத்தவும்"
                                >
                                    <Input label={t('browse:education')} icon="school" name="education" placeholder={t('browse:education_placeholder')} value={localFilters.education || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('education', e.target.value)} className="h-14" />
                                    <Input label={t('browse:job_title')} icon="badge" name="jobTitle" placeholder={t('browse:job_title_placeholder')} value={localFilters.jobTitle || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('jobTitle', e.target.value)} className="h-14" />
                                    <Input label={t('browse:job_location')} icon="location_on" name="jobLocation" placeholder={t('browse:job_location_placeholder')} value={localFilters.jobLocation || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('jobLocation', e.target.value)} className="h-14" />
                                    <div className="pt-4">
                                        <MultiSelect label={t('browse:job_sector')} options={jobSectorOpts} values={localFilters.jobSector || []} onChange={(vals: string[]) => handleChange('jobSector', vals)} placeholder={t('browse:job_sector')} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <RangeSlider min={1} max={100} unit=" L" value={[Number(localFilters.minSalary) || 1, Number(localFilters.maxSalary) || 100]} onChange={(val: number[]) => { handleChange('minSalary', val[0]); handleChange('maxSalary', val[1]); }} label={t('browse:annual_salary')} />
                                    </div>
                                </SectionCard>
                            </div>
                        </div>

                        <div className="shrink-0 relative z-50 p-6 bg-white/80 backdrop-blur-3xl border-t border-gold/10 flex flex-row gap-4 items-center">
                            <button type="button" onClick={handleReset} className="flex-1 h-14 rounded-xl font-black text-xs text-rosewood/50 border-2 border-rosewood/10 hover:border-rosewood/30 hover:text-rosewood hover:bg-rosewood/5 transition-all flex items-center justify-center gap-3 group">
                                <span className="material-symbols-outlined text-xl! group-hover:rotate-180 transition-transform duration-700">restart_alt</span>
                                {t('browse:reset_filters')}
                            </button>
                            <button type="button" onClick={handleApply} className="flex-1 h-14 bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rosewood/20 hover:shadow-rosewood/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                <span className="material-symbols-outlined relative z-10 group-hover:scale-110 transition-transform">search</span>
                                <span className="relative z-10">{t('browse:show_results')}</span>
                            </button>
                        </div>

                        <style dangerouslySetInnerHTML={{ __html: `
                            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(184, 134, 11, 0.15); border-radius: 10px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(184, 134, 11, 0.3); }
                        `}} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
