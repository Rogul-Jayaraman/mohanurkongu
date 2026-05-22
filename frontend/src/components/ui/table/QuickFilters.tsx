import React from 'react';
import { useTranslation } from 'react-i18next';
import Dropdown from '../forms/Dropdown';
import { KULAM_OPTIONS, MARITAL_STATUS_OPTIONS } from '../../../constants/options';
import { DISTRICTS, DISTRICT_TAMIL } from '../../../constants/locations';

interface QuickFiltersProps {
    onFilterClick?: (filterKey?: string) => void;
    filters?: any;
    onFilterChange?: (key: string, value: any) => void;
    className?: string;
}

/**
 * QuickFilters Component
 * 
 * Provides a modern, iconographic horizontal scrollable list of common filters.
 * Uses interactive Dropdown components for direct filtering inline, and supports legacy onFilterClick.
 */
export const QuickFilters: React.FC<QuickFiltersProps> = ({ 
    onFilterClick,
    filters = {},
    onFilterChange,
    className = "" 
}) => {
    const { t, i18n } = useTranslation(['dashboard', 'browse', 'common']);
    const lang = i18n.language as 'en' | 'ta';

    const sortOptions = [
        { value: '', label: { en: 'Default Sort', ta: 'இயல்பான வரிசை' }, icon: 'sort' },
        { value: 'newest', label: { en: 'Newest Profile', ta: 'புதிய வரன்கள்' }, icon: 'new_releases' },
        { value: 'oldest', label: { en: 'Oldest Profile', ta: 'பழைய வரன்கள்' }, icon: 'history' },
    ];

    const ageOptions = [
        { value: '', label: { en: 'Default Age', ta: 'இயல்பான வயது' }, icon: 'cake' },
        { value: 'age_asc', label: { en: 'Age: Low to High', ta: 'வயது (குறைவு → அதிகம்)' }, icon: 'arrow_upward' },
        { value: 'age_desc', label: { en: 'Age: High to Low', ta: 'வயது (அதிகம் → குறைவு)' }, icon: 'arrow_downward' },
    ];

    const toTitleCase = (str: string) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const districtOptions = [
        { value: '', label: { en: 'All Districts', ta: 'அனைத்து மாவட்டங்களும்' } },
        ...DISTRICTS.map(d => ({
            value: d,
            label: { en: toTitleCase(d), ta: (DISTRICT_TAMIL as any)[d] || d }
        }))
    ];

    const maritalStatusOptions = [
        { value: '', label: { en: 'Any Status', ta: 'அனைத்து நிலை' } },
        ...MARITAL_STATUS_OPTIONS.map(m => ({
            value: m.value,
            label: { en: toTitleCase(m.label), ta: m.labelTa }
        }))
    ];

    const handleSelect = (key: string, value: string) => {
        if (onFilterChange) {
            onFilterChange(key, value);
        } else if (onFilterClick) {
            onFilterClick(key);
        }
    };

    // If we only have onFilterClick but no filters/onFilterChange, render legacy buttons
    if (!onFilterChange) {
        const legacyFilters = [
            { key: 'sort_newest', icon: 'new_releases', label: t('browse:sort_newest') },
            { key: 'sort_age', icon: 'sort', label: t('browse:sort_age_low_high') },
            { key: 'filter_kulam', icon: 'groups', label: t('browse:kulam') }
        ];

        return (
            <div className={`overflow-hidden ${className}`}>
                <div className="flex flex-wrap items-center gap-2 pb-1">
                    {legacyFilters.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => onFilterClick?.(f.key)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 border border-gold/20 text-[10px] font-bold text-slate-600 hover:bg-gold/5 active:bg-gold/10 whitespace-nowrap transition-all duration-300 shadow-[0_2px_10px_-4px_rgba(184,134,11,0.1)] hover:shadow-md group"
                        >
                            <span className="material-symbols-outlined text-sm transition-colors group-hover:text-gold">
                                {f.icon}
                            </span>
                            <span>{f.label}</span>
                            <span className="material-symbols-outlined text-[12px] opacity-40 ml-0.5">
                                keyboard_arrow_down
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const isSortValue = filters.sort === 'newest' || filters.sort === 'oldest';
    const isAgeValue = filters.sort === 'age_asc' || filters.sort === 'age_desc';

    const getOptionLabel = (optionsArr: any[], value: string, fallbackEn: string, fallbackTa: string) => {
        if (!value) return lang === 'ta' ? fallbackTa : fallbackEn;
        const opt = optionsArr.find(o => o.value === value);
        if (!opt) return lang === 'ta' ? fallbackTa : fallbackEn;
        return opt.label[lang] || opt.label.en;
    };

    return (
        <div className={`overflow-visible ${className}`}>
            <div className="flex flex-wrap items-center gap-2 pb-2 pt-1 px-1">
                <Dropdown
                    options={sortOptions}
                    value={isSortValue ? filters.sort : ''}
                    onChange={(val: string) => handleSelect('sort', val)}
                    placeholder={lang === 'ta' ? 'வரிசை' : 'Sort'}
                    trigger={
                        <div className={`cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border ${isSortValue && filters.sort ? 'border-rosewood/40 text-rosewood' : 'border-gold/20 text-slate-600'} text-[10px] font-bold hover:bg-gold/5 active:bg-gold/10 whitespace-nowrap transition-all shadow-[0_2px_10px_-4px_rgba(184,134,11,0.1)] hover:shadow-md group shrink-0`}>
                            <span className="material-symbols-outlined text-sm group-hover:text-gold transition-colors">sort</span>
                            <span className="pointer-events-none select-none">{getOptionLabel(sortOptions, isSortValue ? filters.sort : '', 'Sort', 'வரிசை')}</span>
                            <span className="material-symbols-outlined text-[12px] opacity-50 ml-0.5 pointer-events-none">expand_more</span>
                        </div>
                    }
                />

                <Dropdown
                    options={ageOptions}
                    value={isAgeValue ? filters.sort : ''}
                    onChange={(val: string) => handleSelect('sort', val)}
                    placeholder={lang === 'ta' ? 'வயது' : 'Age'}
                    trigger={
                        <div className={`cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border ${isAgeValue && filters.sort ? 'border-rosewood/40 text-rosewood' : 'border-gold/20 text-slate-600'} text-[10px] font-bold hover:bg-gold/5 active:bg-gold/10 whitespace-nowrap transition-all shadow-[0_2px_10px_-4px_rgba(184,134,11,0.1)] hover:shadow-md group shrink-0`}>
                            <span className="material-symbols-outlined text-sm group-hover:text-gold transition-colors">person</span>
                            <span className="pointer-events-none select-none">{getOptionLabel(ageOptions, isAgeValue ? filters.sort : '', 'Age', 'வயது')}</span>
                            <span className="material-symbols-outlined text-[12px] opacity-50 ml-0.5 pointer-events-none">expand_more</span>
                        </div>
                    }
                />

                <Dropdown
                    options={districtOptions}
                    value={filters.currentDistrict || ''}
                    searchable
                    onChange={(val: string) => handleSelect('currentDistrict', val)}
                    placeholder={lang === 'ta' ? 'மாவட்டம்' : 'District'}
                    trigger={
                        <div className={`cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border ${filters.currentDistrict ? 'border-rosewood/40 text-rosewood' : 'border-gold/20 text-slate-600'} text-[10px] font-bold hover:bg-gold/5 active:bg-gold/10 whitespace-nowrap transition-all shadow-[0_2px_10px_-4px_rgba(184,134,11,0.1)] hover:shadow-md group shrink-0`}>
                            <span className="material-symbols-outlined text-sm group-hover:text-gold transition-colors">location_on</span>
                            <span className="pointer-events-none select-none">{getOptionLabel(districtOptions, filters.currentDistrict, 'Location', 'இடம்')}</span>
                            <span className="material-symbols-outlined text-[12px] opacity-50 ml-0.5 pointer-events-none">expand_more</span>
                        </div>
                    }
                />

                <Dropdown
                    options={maritalStatusOptions}
                    value={filters.maritalStatus || ''}
                    onChange={(val: string) => handleSelect('maritalStatus', val)}
                    placeholder={lang === 'ta' ? 'திருமண நிலை' : 'Status'}
                    trigger={
                        <div className={`cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border ${filters.maritalStatus ? 'border-rosewood/40 text-rosewood' : 'border-gold/20 text-slate-600'} text-[10px] font-bold hover:bg-gold/5 active:bg-gold/10 whitespace-nowrap transition-all shadow-[0_2px_10px_-4px_rgba(184,134,11,0.1)] hover:shadow-md group shrink-0`}>
                            <span className="material-symbols-outlined text-sm group-hover:text-gold transition-colors">favorite</span>
                            <span className="pointer-events-none select-none">{getOptionLabel(maritalStatusOptions, filters.maritalStatus, 'Status', 'முறைமை')}</span>
                            <span className="material-symbols-outlined text-[12px] opacity-50 ml-0.5 pointer-events-none">expand_more</span>
                        </div>
                    }
                />
            </div>
        </div>
    );
};
