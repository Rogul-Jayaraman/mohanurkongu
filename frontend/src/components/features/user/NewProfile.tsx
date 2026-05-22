import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBlocker, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import UnsavedChangesModal from '../../modals/user/UnsavedChangesModal';
import { useScrollToTop } from '../../ui/layout/ScrollToTop';
import { useProfileForm } from '../../../hooks/useProfileForm';
import {
    useUploadProfileImageMutation,
    useDeleteProfileImageMutation,
    useSaveDraftMutation,
    useResumeDraftQuery,
    usePublishProfileMutation,
    useCancelDraftMutation,
} from '../../../hooks/queries/useProfiles';
import { useGenerateHoroscope } from '../../../hooks/useGenerateHoroscope';
import { TimePicker, LocationAutocomplete, HoroscopeResults, D1Chart, D9Chart } from '../../../components/shared/horoscope';
import type { HoroscopeResult, PlanetData } from '@/types/horoscope';
import { getBilingualLabel } from '../../../utils/bilingual';
import { useKeyboardFormNavigation } from '../../../hooks/useKeyboardFormNavigation';
import { useLanguage } from '../../../context/LanguageContext';
import { Spinner } from '../../ui/feedback/Spinner';
import TranslatableInput from '../../ui/forms/TranslatableInput';
import TranslatableTextarea from '../../ui/forms/TranslatableTextarea';
import { Input } from '../../ui/forms/Input';
import Select from '../../ui/forms/Select';
import Toggle from '../../ui/forms/FormToggle';
import {
    PROFILE_FOR_OPTIONS, GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, DIET_OPTIONS,
    COMPLEXION_OPTIONS, BLOOD_GROUP_OPTIONS, HEIGHT_OPTIONS, JOB_SECTOR_OPTIONS,
    RESIDENCE_OPTIONS, RASI_OPTIONS, NAKSHATRA_OPTIONS, DOSHAM_OPTIONS, KULAM_OPTIONS
} from '../../../constants';
import { DISTRICTS, TALUKS_BY_DISTRICT, DISTRICT_TAMIL, TALUK_TAMIL } from '../../../constants/locations';

// ═══════════════════════════════════════════════════════════
// WizardFooter
// ═══════════════════════════════════════════════════════════

interface WizardFooterProps {
    steps: { title: string; icon: string }[];
    currentStep: number;
    handleBack: () => void;
    handleNext: () => void;
    handleSubmit: () => void;
    handleSaveDraft: () => void;
    loading: boolean;
    isStepValid: boolean;
}

const WizardFooter: React.FC<WizardFooterProps> = ({ currentStep, steps, handleBack, handleNext, handleSubmit, handleSaveDraft, loading, isStepValid }) => {
    const isLast = currentStep === steps.length;
    const { t } = useLanguage();

    return (
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gold-soft/10 px-6 sm:px-10 py-4 2xl:px-16 2xl:py-5 flex items-center justify-between gap-4 z-50">
            <div className="flex-1 flex items-center gap-2 sm:gap-4">
                <button type="button" onClick={handleBack} disabled={currentStep === 1}
                    className={`group flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentStep === 1 ? 'invisible' : 'text-slate-500 hover:text-rosewood hover:bg-slate-50'}`}>
                    <span className="material-symbols-outlined text-base! group-hover:-translate-x-1 transition-transform duration-300">chevron_left</span>
                    <span className="hidden sm:inline">{t('setup.back')}</span>
                </button>
            </div>
            <div className="hidden sm:flex items-center gap-2">
                {steps.map((_, i) => (
                    <div key={i} className={`transition-all duration-700 rounded-full ${i + 1 === currentStep ? 'w-5 h-1.5 bg-rosewood' : i + 1 < currentStep ? 'size-1.5 bg-gold/60' : 'size-1.5 bg-slate-200'}`} />
                ))}
            </div>
            <div className="flex-1 flex justify-end items-center gap-3">
                <button type="button" onClick={handleSaveDraft} disabled={loading}
                    className={`flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl transition-all text-xs font-bold tracking-wider ${loading ? 'opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-rosewood hover:border-rosewood/30 hover:bg-rosewood/5'}`}>
                    {loading ? <Spinner size="sm" color="rosewood" /> : <span className="material-symbols-outlined text-sm!">save</span>}
                    <span className="hidden lg:inline">{t('common:save_as_draft')}</span>
                </button>
                {isLast ? (
                    <button type="button" onClick={handleSubmit} disabled={loading || !isStepValid}
                        className={`flex items-center gap-2 px-6 py-2.5 text-white font-medium rounded-xl shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto justify-center ${(!isStepValid && !loading) ? 'bg-slate-300 cursor-not-allowed opacity-50' : 'bg-rosewood hover:bg-rosewood-dark shadow-lg shadow-rosewood/20'}`}>
                        {loading ? <Spinner size="sm" color="white" /> : (
                            <div className='flex items-center justify-center gap-2'>
                                <span className="text-sm font-bold">{t('setup.create')}</span>
                                <span className="material-symbols-outlined text-base!">check</span>
                            </div>
                        )}
                    </button>
                ) : (
                    <button type="button" onClick={handleNext}
                        className="group flex items-center gap-2 px-8 py-2.5 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-sm transition-all active:scale-[0.98] hover:bg-rosewood-dark w-full sm:w-auto justify-center">
                        <div className='flex items-center justify-center gap-2'>
                            <span>{t('setup.next')}</span>
                            <span className="material-symbols-outlined text-base! group-hover:translate-x-1 transition-transform">chevron_right</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// WizardLayout
// ═══════════════════════════════════════════════════════════

interface WizardLayoutProps {
    steps: { title: string; icon: string }[];
    currentStep: number;
    children: React.ReactNode;
    handleBack: () => void;
    handleNext: () => void;
    handleSubmit: () => void;
    handleSaveDraft: () => void;
    loading: boolean;
    isStepValid: boolean;
    title?: string;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({ steps, currentStep, children, handleBack, handleNext, handleSubmit, handleSaveDraft, loading, isStepValid }) => {
    const { t } = useLanguage();

    return (
        <div className="flex-1 w-full bg-white font-manrope overflow-hidden relative flex flex-col">
            <div className="absolute top-0 left-1/4 w-[60vw] h-[60vh] bg-gold/5 rounded-full blur-[180px] pointer-events-none -translate-x-1/2 -translate-y-1/3"></div>
            <div className="absolute bottom-0 right-1/4 w-[50vw] h-[50vh] bg-rosewood/5 rounded-full blur-[200px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>
            <div className="flex shrink-0 w-full h-[2px] bg-gold-soft/20 z-30">
                <div className="bg-rosewood h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(118,36,44,0.3)]" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
            </div>
            <div className="flex-1 flex flex-col h-full relative z-20 overflow-hidden">
                <div className="main-content-scroll flex-1 overflow-y-auto overflow-x-hidden py-8 px-6 lg:py-12 lg:px-12 relative custom-scrollbar">
                    <div className="w-full max-w-4xl mx-auto pb-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-rosewood leading-tight">{t('nav.new_profile')}</h1>
                                <div className="mt-2 h-1 w-12 bg-gold/50 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-soft/30 border border-gold-soft/50 text-rosewood text-xs font-black tracking-wider rounded-full shrink-0 shadow-sm shadow-gold/10">
                                    <span className="material-symbols-outlined text-sm!">{steps[currentStep - 1].icon}</span>
                                    {t('setup.stepProgress', { current: currentStep, total: steps.length })}
                                </span>
                            </div>
                        </div>
                        <div className="w-full">{children}</div>
                    </div>
                </div>
                <WizardFooter steps={steps} currentStep={currentStep} handleBack={handleBack} handleNext={handleNext} handleSubmit={handleSubmit} handleSaveDraft={handleSaveDraft} loading={loading} isStepValid={isStepValid} />
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// SouthIndianChart
// ═══════════════════════════════════════════════════════════

interface Planet { name: string; sign: number; degrees?: number; isAscendant?: boolean; }
interface SouthIndianChartProps { planets: Planet[]; title?: string; showSignNumbers?: boolean; readOnly?: boolean; size?: string; }

const SouthIndianChart: React.FC<SouthIndianChartProps> = ({ planets, title, showSignNumbers = false }) => {
    const { t } = useTranslation();
    const signPositions: Record<number, [number, number]> = { 0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3], 4: [2, 3], 5: [3, 3], 6: [3, 2], 7: [3, 1], 8: [3, 0], 9: [2, 0], 10: [1, 0], 11: [0, 0] };
    const cellSize = 100;
    const gridWidth = 4 * cellSize;
    const gridHeight = 4 * cellSize;
    const planetsBySign: Record<number, Planet[]> = {};
    const validPlanets = Array.isArray(planets) ? planets.filter(p => p && typeof p === 'object' && typeof p.sign === 'number' && p.sign >= 0 && p.sign <= 11 && p.name) : [];
    validPlanets.forEach(p => { if (!planetsBySign[p.sign]) planetsBySign[p.sign] = []; planetsBySign[p.sign].push(p); });
    const getTranslatedPlanetName = (name: string) => {
        if (!name || typeof name !== 'string') return '';
        const cleanName = name.toString().trim();
        if (!cleanName) return '';
        const lowerName = cleanName.toLowerCase();
        const translationKey = `profile_new:horoscope.planets.${lowerName}`;
        const translated = t(translationKey);
        const finalName = translated === translationKey ? cleanName : translated;
        return finalName.charAt(0).toUpperCase() + finalName.slice(1);
    };
    const lagnamLabel = t('profile_new:horoscope.lagnam_short', { defaultValue: 'ல' });

    return (
        <div className="flex flex-col items-center w-full max-w-[440px] mx-auto p-4">
            <div className="w-full bg-ivory rounded-xl overflow-hidden shadow-lg shadow-rosewood/10 ring-1 ring-gold/30 aspect-square relative">
                <div className="absolute inset-0 kolam-watermark opacity-30 pointer-events-none" />
                <svg viewBox={`0 0 ${gridWidth} ${gridHeight}`} className="w-full h-full relative z-10">
                    {Array.from({ length: 4 }).map((_, row) =>
                        Array.from({ length: 4 }).map((_, col) => {
                            if (row >= 1 && row <= 2 && col >= 1 && col <= 2) return null;
                            const x = col * cellSize;
                            const y = row * cellSize;
                            const signEntry = Object.entries(signPositions).find(([_, pos]) => pos[0] === row && pos[1] === col);
                            const signIndex = signEntry ? parseInt(signEntry[0]) : -1;
                            const signPlanets = signIndex !== -1 ? planetsBySign[signIndex] || [] : [];
                            return (
                                <g key={`${row}-${col}`}>
                                    <rect x={x} y={y} width={cellSize} height={cellSize} fill="white" fillOpacity="0.4" stroke="var(--color-gold)" strokeWidth="0.5" strokeOpacity="0.4" />
                                    {showSignNumbers && signIndex !== -1 && (
                                        <text x={x + cellSize - 8} y={y + cellSize - 8} textAnchor="end" className="fill-gold/40 text-[10px] font-bold italic select-none">{signIndex + 1}</text>
                                    )}
                                    <foreignObject x={x} y={y} width={cellSize} height={cellSize}>
                                        <div className="w-full h-full flex flex-col items-center justify-center p-2 leading-[1.3] gap-1.5 pt-4">
                                            {signPlanets.filter(p => !p.isAscendant).map((p, pIdx) => (
                                                <span key={pIdx} className="text-[10px] text-slate-800 drop-shadow-sm text-center">{getTranslatedPlanetName(p.name)}</span>
                                            ))}
                                            {signPlanets.find(p => p.isAscendant) && (
                                                <div className="relative flex items-center justify-center">
                                                    <div className="text-[10px] font-semibold text-rosewood bg-gold/10 w-4 h-4 p-3 flex items-center justify-center rounded-md border border-gold/30 shadow-sm min-w-[24px]">{lagnamLabel}</div>
                                                </div>
                                            )}
                                        </div>
                                    </foreignObject>
                                    {signPlanets.find(p => p.isAscendant) && (
                                        <line x1={x} y1={y + 20} x2={x + 20} y2={y} stroke="var(--color-gold)" strokeWidth="1.3" strokeOpacity="0.8" />
                                    )}
                                </g>
                            );
                        })
                    )}
                    {title && (<g><text x={gridWidth / 2} y={gridHeight / 2 + 8} textAnchor="middle" className="fill-rosewood text-[16px] font-serif font-bold">{title}</text></g>)}
                    <rect x={cellSize} y={cellSize} width={cellSize * 2} height={cellSize * 2} fill="var(--color-ivory-dark)" fillOpacity="0.3" stroke="none" />
                    <rect x="0" y="0" width={gridWidth} height={gridHeight} fill="none" stroke="var(--color-gold)" strokeWidth="1.5" rx="12" />
                    <rect x={cellSize} y={cellSize} width={cellSize * 2} height={cellSize * 2} fill="none" stroke="var(--color-gold)" strokeWidth="1" strokeOpacity="0.4" />
                </svg>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// HoroscopeMethodSelector
// ═══════════════════════════════════════════════════════════

const HoroscopeMethodSelector: React.FC<{ onSelect: (method: 'CREATE' | 'UPLOAD') => void }> = ({ onSelect }) => {
    const { t } = useTranslation(['profile_new']);
    return (
        <motion.div key="choice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => onSelect('CREATE')} className="group relative bg-white border-2 border-gold-soft/10 rounded-3xl p-8 text-left transition-all hover:border-rosewood/30 hover:shadow-xl hover:shadow-rosewood/5 overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500"><span className="material-symbols-outlined text-9xl">auto_awesome</span></div>
                <div className="relative z-10 space-y-4">
                    <div className="size-14 bg-rosewood/5 rounded-2xl flex items-center justify-center text-rosewood group-hover:bg-rosewood group-hover:text-white transition-colors duration-300"><span className="material-symbols-outlined text-3xl">magic_button</span></div>
                    <div><h4 className="text-xl font-black text-rosewood uppercase tracking-tight">{t('profile_new:horoscope.auto_generate')}</h4><p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed italic">{t('profile_new:horoscope.auto_generate_sub')}</p></div>
                    <div className="pt-4 flex items-center gap-2 text-rosewood font-black text-[10px] uppercase tracking-widest"><span className="leading-none">{t('profile_new:horoscope.select_mode')}</span><span className="material-symbols-outlined text-sm leading-none group-hover:translate-x-1 transition-transform">arrow_forward</span></div>
                </div>
            </button>
            <button onClick={() => onSelect('UPLOAD')} className="group relative bg-white border-2 border-gold-soft/10 rounded-3xl p-8 text-left transition-all hover:border-rosewood/30 hover:shadow-xl hover:shadow-rosewood/5 overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500"><span className="material-symbols-outlined text-9xl">upload_file</span></div>
                <div className="relative z-10 space-y-4">
                    <div className="size-14 bg-rosewood/5 rounded-2xl flex items-center justify-center text-rosewood group-hover:bg-rosewood group-hover:text-white transition-colors duration-300"><span className="material-symbols-outlined text-3xl">cloud_upload</span></div>
                    <div><h4 className="text-xl font-black text-rosewood uppercase tracking-tight">{t('profile_new:horoscope.upload_chart')}</h4><p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed italic">{t('profile_new:horoscope.upload_chart_sub')}</p></div>
                    <div className="pt-4 flex items-center gap-2 text-rosewood font-black text-[10px] uppercase tracking-widest"><span className="leading-none">{t('profile_new:horoscope.select_mode')}</span><span className="material-symbols-outlined text-sm leading-none group-hover:translate-x-1 transition-transform">arrow_forward</span></div>
                </div>
            </button>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════
// HoroscopeAutoForm
// ═══════════════════════════════════════════════════════════

const HoroscopeAutoForm: React.FC<{
    dob: string; onDobChange: (dob: string) => void; birthTime: string; onBirthTimeChange: (time: string) => void;
    birthPlaceName: string; onBirthPlaceChange: (data: { name: string; lat?: number; lon?: number }) => void;
    onGenerate: () => void; isGenerating: boolean;
}> = ({ dob, onDobChange, birthTime, onBirthTimeChange, birthPlaceName, onBirthPlaceChange, onGenerate, isGenerating }) => {
    const { t } = useTranslation(['profile_new']);
    return (
        <div className="space-y-8">
            <div className="bg-white border border-gold-soft/30 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl shadow-rosewood/5 ring-1 ring-gold-soft/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2 group text-left">
                        <div className="flex items-center justify-start gap-2 px-1"><label className="block text-xs font-input-label text-input-label tracking-tight">{t('profile_new:dob')}<span className="text-gold ml-1">*</span></label></div>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 w-5 h-5 z-10 text-input-icon group-focus-within:scale-110"><span className="material-symbols-outlined text-[20px] font-variation-medium">event</span></div>
                            <input type="date" value={dob ? dob.split('T')[0] : ''} onChange={(e) => onDobChange(e.target.value)} className="w-full h-14 pl-12 pr-12 bg-input-bg border-2 border-input-border rounded-xl focus:border-input-focus focus:ring-4 focus:ring-input-ring outline-none transition-all font-input-text text-sm text-input-text shadow-xl shadow-input-shadow hover:border-input-border-hover [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
                        </div>
                    </div>
                    <div className="space-y-2 group text-left">
                        <TimePicker value={birthTime} onChange={onBirthTimeChange} label={t('profile_new:horoscope.birth_time')} required />
                    </div>
                    <div className="md:col-span-2 pt-2">
                        <LocationAutocomplete
                            value={birthPlaceName}
                            onChange={(val) => onBirthPlaceChange({ name: val })}
                            onSelect={(loc) => onBirthPlaceChange({ name: loc.displayName, lat: loc.latitude, lon: loc.longitude })}
                            label={t('profile_new:horoscope.birth_place')}
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                <button type="button" onClick={onGenerate} disabled={isGenerating || !birthTime || !birthPlaceName || !dob}
                    className="group relative px-12 py-4 bg-rosewood text-white rounded-2xl font-black italic shadow-2xl shadow-rosewood/30 hover:bg-rosewood-dark transition-all disabled:opacity-50 flex items-center gap-4 overflow-hidden">
                    {isGenerating ? (<span className="animate-spin material-symbols-outlined leading-none">refresh</span>) : (<span className="material-symbols-outlined leading-none">auto_awesome</span>)}
                    <span className="tracking-widest uppercase text-xs leading-none">{isGenerating ? t('profile_new:horoscope.generating') : t('profile_new:horoscope.generate_now')}</span>
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// HoroscopeUploadForm
// ═══════════════════════════════════════════════════════════

const HoroscopeUploadForm: React.FC<{
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'rasi' | 'navamsa' | 'full') => void;
    onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>;
    rasiChartUrl?: string | null; navamsaChartUrl?: string | null; fullChartUrl?: string | null;
    isUploading?: boolean; uploadingType?: string | null;
}> = ({ onFileUpload, onFileDelete, rasiChartUrl, navamsaChartUrl, isUploading = false, uploadingType }) => {
    const { t } = useTranslation(['profile_new']);
    const UploadCard = ({ chartUrl, type, labelKey }: { chartUrl?: string | null; type: 'rasi' | 'navamsa'; labelKey: string }) => (
        <div className="relative group min-h-[320px] bg-white rounded-4xl border-2 border-dashed border-gold-soft/30 transition-all duration-500 hover:border-gold hover:shadow-2xl shadow-rosewood/5 overflow-hidden">
            {chartUrl ? (
                <div className="absolute inset-0 bg-white">
                    <img src={chartUrl} alt={type} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                    {isUploading && uploadingType === type && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30"><span className="material-symbols-outlined text-4xl text-rosewood animate-spin mb-2">autorenew</span><span className="text-[10px] font-black text-rosewood uppercase tracking-widest">Processing...</span></div>)}
                    {!isUploading && (<div className="absolute inset-0 bg-rosewood/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center"><label className="relative size-16 bg-white/20 backdrop-blur-xl border border-white/40 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-white hover:text-rosewood transition-all duration-500 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] scale-90 group-hover:scale-100 hover:rotate-180"><span className="material-symbols-outlined text-3xl">autorenew</span><input type="file" className="hidden" accept="image/*" onChange={(e) => onFileUpload(e, type)} /></label><div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 pointer-events-none"><span className="text-[9px] font-black text-white uppercase tracking-[0.3em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">{t('profile_new:horoscope.click_to_change')}</span></div></div>)}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between"><div className="px-5 py-2.5 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl"><span className="text-[10px] font-black text-rosewood uppercase tracking-widest">{t(`profile_new:horoscope.${labelKey}`)}</span></div></div>
                    {!isUploading && (<button onClick={() => onFileDelete(type)} className="absolute top-4 right-4 size-8 bg-white/80 backdrop-blur-md text-rosewood rounded-full shadow-lg border border-white/40 flex items-center justify-center z-20 hover:scale-110 active:scale-95 transition-all hover:bg-rosewood hover:text-white"><span className="material-symbols-outlined text-sm font-black">close</span></button>)}
                </div>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-6 text-center">
                    <div className="size-24 bg-rosewood/5 rounded-3xl flex items-center justify-center border-2 border-gold-soft/20 group-hover:border-gold transition-all duration-500 relative">{isUploading && uploadingType === type ? (<div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl z-10"><span className="material-symbols-outlined text-4xl text-rosewood animate-spin">autorenew</span></div>) : (<span className="material-symbols-outlined text-5xl text-rosewood/20 group-hover:text-gold transition-colors">{type === 'rasi' ? 'grid_view' : 'dashboard_customize'}</span>)}</div>
                    <div className="space-y-1"><h4 className="text-sm font-black text-rosewood uppercase tracking-widest leading-none">{t(`profile_new:horoscope.${labelKey}`)}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter opacity-60">{t('profile_new:horoscope.high_res_preferred')}</p></div>
                    <label className={`px-10 py-3.5 bg-rosewood/5 border border-rosewood/20 text-rosewood rounded-xl font-black text-[10px] tracking-widest cursor-pointer hover:bg-rosewood hover:text-white transition-all duration-500 flex items-center gap-3 uppercase ${isUploading && uploadingType === type ? 'opacity-50 pointer-events-none' : ''}`}><span className="material-symbols-outlined text-lg">add_a_photo</span>{t('profile_new:horoscope.select_file')}<input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={(e) => onFileUpload(e, type)} /></label>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-10">
            <div className="text-center space-y-2"><div className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full mb-2"><span className="text-[9px] font-black text-gold uppercase tracking-[0.2em]">{t('profile_new:horoscope.secure_portal')}</span></div><h3 className="text-xl font-black text-rosewood leading-tight uppercase tracking-tight">{t('profile_new:horoscope.upload_your_charts')}</h3><div className="w-12 h-1 bg-linear-to-r from-transparent via-gold/40 to-transparent mx-auto"></div></div>
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><UploadCard chartUrl={rasiChartUrl} type="rasi" labelKey="rasi_chart_label" /><UploadCard chartUrl={navamsaChartUrl} type="navamsa" labelKey="navamsa_chart_label" /></div>
            </motion.div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// HoroscopeResultsView
// ═══════════════════════════════════════════════════════════

const HoroscopeResultsView: React.FC<{ mode: 'CREATE' | 'UPLOAD'; result?: any; rasi?: any; navamsa?: any; profileName?: string; onRegenerate: () => void; }> = ({ mode, result, rasi, navamsa, profileName, onRegenerate }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center bg-ivory/50 p-4 rounded-2xl border border-gold-soft/20 shadow-sm">
                <div className="flex items-center gap-3"><div className="size-10 rounded-xl bg-rosewood/5 flex items-center justify-center text-rosewood border border-rosewood/10"><span className="material-symbols-outlined text-xl">{mode === 'CREATE' ? 'account_balance_wallet' : 'collections'}</span></div><div><h3 className="text-xs font-black text-rosewood uppercase tracking-widest">{mode === 'CREATE' ? t('profile_new:horoscope.your_horoscope_charts') : t('profile_new:horoscope.uploaded_both')}</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{mode === 'CREATE' ? 'Auto Generated Chart' : t('profile_new:horoscope.manually_uploaded')}</p></div></div>
                <button onClick={onRegenerate} className="flex items-center gap-2 text-[10px] font-black text-gold hover:text-rosewood uppercase transition-colors group leading-none"><span className="material-symbols-outlined text-sm leading-none group-hover:rotate-180 transition-transform duration-500">sync</span><span className="leading-none">{mode === 'CREATE' ? t('common:regenerate') : t('profile_new:horoscope.update_files', 'Update Files')}</span></button>
            </div>
            {mode === 'CREATE' && result ? (
                <HoroscopeResults result={result} loading={false} error={null} />
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['Rasi', 'Navamsa'].map((chart, idx) => {
                            const url = idx === 0 ? rasi : navamsa;
                            return (<div key={chart} className="bg-white border-2 border-gold-soft/20 rounded-3xl overflow-hidden shadow-2xl shadow-rosewood/10"><div className="aspect-square relative group bg-slate-50 border-b border-gold-soft/10">{url ? (<img src={url} alt={chart} className="w-full h-full object-contain p-4" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300"><span className="material-symbols-outlined text-4xl">image_not_supported</span></div>)}<div className="absolute top-4 left-4"><span className="px-3 py-1 bg-rosewood text-white text-[8px] font-black uppercase rounded-lg tracking-widest shadow-lg">{t(`profile_new:horoscope.${chart.toLowerCase()}_chart_label`)}</span></div>{url && (<div className="absolute inset-0 bg-rosewood/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"><a href={url} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-white text-rosewood rounded-lg font-black text-[9px] uppercase shadow-2xl">{t('profile_new:horoscope.full_view')}</a></div>)}</div><div className="p-3 bg-white flex items-center justify-between"><span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{chart} Chart</span><div className="text-[8px] font-black text-gold/50 uppercase italic">{t('profile_new:horoscope.verified')}</div></div></div>);
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step2Personal
// ═══════════════════════════════════════════════════════════

interface StepProps { formData: any; updateField: (field: any, value: any) => void; onAction?: () => void; }

const Step2Personal: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    const districtToStringOptions = (arr: string[]) => arr.map(s => { const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); return { value: s, label: { en: formattedEn, ta: DISTRICT_TAMIL[s] || formattedEn } }; });
    const talukToStringOptions = (arr: string[]) => arr.map(s => { const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); return { value: s, label: { en: formattedEn, ta: TALUK_TAMIL[s] || formattedEn } }; });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">groups</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.connection')}</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label={t('profile_new:profile_for')} value={formData.profileFor || ''} onChange={(val) => updateField('profileFor', val)} options={PROFILE_FOR_OPTIONS} required />
                    <Toggle label={t('profile_new:gender')} value={formData.gender || ''} onChange={(val) => updateField('gender', val)} options={GENDER_OPTIONS} name="gender" required />
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <TranslatableInput label={t('profile_new:first_name')} valueEn={formData.firstNameEn || ''} valueTa={formData.firstNameTa || ''} onChangeEn={(val) => updateField('firstNameEn', val)} onChangeTa={(val) => updateField('firstNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.first_name')} required />
                        <TranslatableInput label={t('profile_new:last_name')} valueEn={formData.lastNameEn || ''} valueTa={formData.lastNameTa || ''} onChangeEn={(val) => updateField('lastNameEn', val)} onChangeTa={(val) => updateField('lastNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.last_name')} required />
                    </div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">accessibility_new</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.body_lifestyle')}</h3></div>
                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><Select label={t('profile_new:marital_status')} value={formData.maritalStatus || ''} onChange={(val) => updateField('maritalStatus', val)} options={MARITAL_STATUS_OPTIONS} required /><Toggle label={t('profile_new:diet')} value={formData.diet || ''} onChange={(val) => updateField('diet', val)} options={DIET_OPTIONS} name="diet" required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gold-soft/5">
                        <Select label={t('profile_new:blood_group')} value={formData.bloodGroup || ''} onChange={(val) => updateField('bloodGroup', val)} options={BLOOD_GROUP_OPTIONS} required />
                        <Select label={t('profile_new:height')} value={formData.height?.toString() || ''} onChange={(val) => updateField('height', parseInt(val))} options={HEIGHT_OPTIONS} required />
                        <Input label={t('profile_new:weight')} name="weight" value={formData.weight?.toString() || ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = parseInt(val); if (val !== '' && numVal > 250) return; updateField('weight', val === '' ? undefined : numVal); }} icon="monitor_weight" placeholder={t('profile_new:placeholders.weight')} inputMode="numeric" required><span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[10px] text-slate-300 group-hover/input:text-rosewood transition-colors">KG</span></Input>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gold-soft/5"><Select label={t('profile_new:complexion')} value={formData.complexion || 'NOT_SPECIFIED'} onChange={(val) => updateField('complexion', val)} options={COMPLEXION_OPTIONS} /></div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">location_on</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.locations')}</h3></div>
                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select label={t('profile_new:current_district')} value={formData.currentDistrict || ''} onChange={(val) => { updateField('currentDistrict', val); if (val !== 'OTHER') { updateField('currentDistrictEn', val); updateField('currentDistrictTa', DISTRICT_TAMIL[val] || val); updateField('currentStateEn', 'Tamil Nadu'); updateField('currentStateTa', 'தமிழ்நாடு'); updateField('currentCountryEn', 'India'); updateField('currentCountryTa', 'இந்தியா'); } else { updateField('currentDistrictEn', ''); updateField('currentDistrictTa', ''); updateField('currentTaluk', ''); updateField('currentCityEn', ''); updateField('currentCityTa', ''); } }} options={districtToStringOptions(DISTRICTS)} required />
                        {formData.currentDistrict !== 'OTHER' ? (<Select label={t('profile_new:current_taluk')} disabled={!formData.currentDistrict} value={formData.currentTaluk || ''} onChange={(val) => { updateField('currentTaluk', val); updateField('currentCityEn', val); updateField('currentCityTa', TALUK_TAMIL[val] || val); }} options={talukToStringOptions(formData.currentDistrict ? TALUKS_BY_DISTRICT[formData.currentDistrict] : [])} placeholder={formData.currentDistrict ? t('profile_new:placeholders.select_taluk') : t('profile_new:placeholders.select_district_first')} required />) : (<TranslatableInput label={t('profile_new:current_district_other')} valueEn={formData.currentDistrictEn || ''} valueTa={formData.currentDistrictTa || ''} onChangeEn={(val) => updateField('currentDistrictEn', val)} onChangeTa={(val) => updateField('currentDistrictTa', val)} placeholder={t('profile_new:placeholders.district')} required />)}
                    </div>
                    {formData.currentDistrict === 'OTHER' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                        <TranslatableInput label={t('profile_new:current_city')} valueEn={formData.currentCityEn || ''} valueTa={formData.currentCityTa || ''} onChangeEn={(val) => updateField('currentCityEn', val)} onChangeTa={(val) => updateField('currentCityTa', val)} placeholder={t('profile_new:placeholders.city')} required />
                        <TranslatableInput label={t('profile_new:current_state')} valueEn={formData.currentStateEn || ''} valueTa={formData.currentStateTa || ''} onChangeEn={(val) => updateField('currentStateEn', val)} onChangeTa={(val) => updateField('currentStateTa', val)} placeholder={t('profile_new:placeholders.state')} required />
                        <TranslatableInput label={t('profile_new:current_country')} valueEn={formData.currentCountryEn || ''} valueTa={formData.currentCountryTa || ''} onChangeEn={(val) => updateField('currentCountryEn', val)} onChangeTa={(val) => updateField('currentCountryTa', val)} placeholder={t('profile_new:placeholders.country')} required />
                    </div>)}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gold-soft/5">
                        <Select label={t('profile_new:native_district')} value={formData.nativeDistrict || ''} onChange={(val) => { updateField('nativeDistrict', val); updateField('nativeTaluk', ''); }} options={districtToStringOptions(DISTRICTS)} required />
                        <Select label={t('profile_new:native_taluk')} disabled={!formData.nativeDistrict} value={formData.nativeTaluk || ''} onChange={(val) => updateField('nativeTaluk', val)} options={talukToStringOptions(formData.nativeDistrict ? TALUKS_BY_DISTRICT[formData.nativeDistrict] : [])} placeholder={formData.nativeDistrict ? t('profile_new:placeholders.select_taluk') : t('profile_new:placeholders.select_district_first')} required />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step3Community
// ═══════════════════════════════════════════════════════════

const Step3Community: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">temple_hindu</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.community')}</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5"><label className="flex gap-1 items-center text-rosewood/80 font-heading font-semibold text-xs">{t('profile_new:caste')}</label><div className="px-5 py-3 bg-ivory/30 border border-gold-soft/20 rounded-xl text-sm font-bold text-rosewood/50 cursor-not-allowed select-none transition-colors">{t('profile_new:caste_val')}</div></div>
                    <div className="space-y-1.5"><label className="flex gap-1 items-center text-rosewood/80 font-heading font-semibold text-xs">{t('profile_new:community')}</label><div className="px-5 py-3 bg-ivory/30 border border-gold-soft/20 rounded-xl text-sm font-bold text-rosewood/50 cursor-not-allowed select-none transition-colors">{t('profile_new:community_val')}</div></div>
                    <Select label={t('profile_new:kulam')} value={formData.kulam || ''} onChange={(val) => updateField('kulam', val)} options={KULAM_OPTIONS} required placeholder={t('profile_new:placeholders.kulam')} />
                    <TranslatableInput label={t('profile_new:kuladeivam')} valueEn={formData.kuladeivamEn || ''} valueTa={formData.kuladeivamTa || ''} onChangeEn={(val) => updateField('kuladeivamEn', val)} onChangeTa={(val) => updateField('kuladeivamTa', val)} placeholder={t('profile_new:placeholders.kuladeivam')} required />
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">wb_sunny</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.astrology')}</h3></div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Select label={t('profile_new:star')} value={formData.star || ''} onChange={(val) => updateField('star', val)} options={NAKSHATRA_OPTIONS} required bilingual />
                    <Select label={t('profile_new:rasi')} value={formData.rasi || ''} onChange={(val) => updateField('rasi', val)} options={RASI_OPTIONS} required bilingual />
                    <Select label={t('profile_new:laganam')} value={formData.laganam || ''} onChange={(val) => updateField('laganam', val)} options={RASI_OPTIONS} required bilingual />
                    <Select label={t('profile_new:dosham')} value={formData.dosham || ''} onChange={(val) => updateField('dosham', val)} options={DOSHAM_OPTIONS} required />
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step4Professional
// ═══════════════════════════════════════════════════════════

const Step4Professional: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">school</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.academic')}</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"><Input label={t('profile_new:education')} icon="school" name="education" value={formData.education || ''} onChange={(e) => updateField('education', e.target.value)} placeholder={t('profile_new:placeholders.education')} className="md:col-span-2" /></div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">work</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.career')}</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label={t('profile_new:job_sector')} value={formData.jobSector || ''} onChange={(val) => updateField('jobSector', val)} options={JOB_SECTOR_OPTIONS} />
                    <Input label={t('profile_new:job_detail')} icon="work" name="jobDetail" value={formData.jobDetail || ''} onChange={(e) => updateField('jobDetail', e.target.value)} placeholder={t('profile_new:placeholders.job_detail')} />
                    <Input label={t('profile_new:salary_monthly')} icon="payments" name="salaryMonthly" type="text" value={formData.salaryMonthly ? formData.salaryMonthly.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('salaryMonthly', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" className="md:col-span-2" />
                    {formData.salaryMonthly > 0 && (<div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500 md:col-span-2"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">₹ {formData.salaryMonthly.toLocaleString('en-IN')} / {t('common:month')}</span></div>)}
                    <Input label={t('profile_new:company_name')} icon="apartment" name="companyName" value={formData.companyName || ''} onChange={(e) => updateField('companyName', e.target.value)} placeholder={t('profile_new:placeholders.company_name')} />
                    <TranslatableInput label={t('profile_new:job_location')} valueEn={formData.jobLocationEn || ''} valueTa={formData.jobLocationTa || ''} onChangeEn={(val) => updateField('jobLocationEn', val)} onChangeTa={(val) => updateField('jobLocationTa', val)} placeholder={t('profile_new:placeholders.job_location')} />
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step5Family
// ═══════════════════════════════════════════════════════════

const Step5Family: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">person</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.father')}</h3></div>
                    <label className="flex items-center gap-2 cursor-pointer group px-3 py-1 bg-white border border-slate-200 rounded-full transition-all hover:border-rosewood/30"><input type="checkbox" checked={formData.fatherIsLate || false} onChange={(e) => updateField('fatherIsLate', e.target.checked)} className="size-3.5 text-rosewood focus:ring-rosewood rounded border-slate-300" /><span className={`text-[10px] font-black tracking-wider transition-colors ${formData.fatherIsLate ? 'text-rosewood' : 'text-slate-500'}`}>{t('profile_new:is_late')}?</span></label>
                </div>
                <div className="p-6 space-y-5">
                    <TranslatableInput label={t('profile_new:father_name')} valueEn={formData.fatherNameEn || ''} valueTa={formData.fatherNameTa || ''} onChangeEn={(val) => updateField('fatherNameEn', val)} onChangeTa={(val) => updateField('fatherNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.father_name')} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input label={t('profile_new:father_job')} icon="work" name="fatherJob" value={formData.fatherJob || ''} onChange={(e) => updateField('fatherJob', e.target.value)} placeholder={t('profile_new:placeholders.father_job')} />
                        <Input label={t('profile_new:father_salary')} icon="payments" name="fatherSalary" type="text" value={formData.fatherSalary ? formData.fatherSalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('fatherSalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                    </div>
                    {formData.fatherSalary > 0 && (<div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">₹ {formData.fatherSalary.toLocaleString('en-IN')} / {t('common:month')}</span></div>)}
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">person_2</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.mother')}</h3></div>
                    <label className="flex items-center gap-2 cursor-pointer group px-3 py-1 bg-white border border-slate-200 rounded-full transition-all hover:border-rosewood/30"><input type="checkbox" checked={formData.motherIsLate || false} onChange={(e) => updateField('motherIsLate', e.target.checked)} className="size-3.5 text-rosewood focus:ring-rosewood rounded border-slate-300" /><span className={`text-[10px] font-black tracking-wider transition-colors ${formData.motherIsLate ? 'text-rosewood' : 'text-slate-500'}`}>{t('profile_new:is_late')}?</span></label>
                </div>
                <div className="p-6 space-y-5">
                    <TranslatableInput label={t('profile_new:mother_name')} valueEn={formData.motherNameEn || ''} valueTa={formData.motherNameTa || ''} onChangeEn={(val) => updateField('motherNameEn', val)} onChangeTa={(val) => updateField('motherNameTa', val)} icon="person_2" placeholder={t('profile_new:placeholders.mother_name')} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input label={t('profile_new:mother_job')} icon="work" name="motherJob" value={formData.motherJob || ''} onChange={(e) => updateField('motherJob', e.target.value)} placeholder={t('profile_new:placeholders.mother_job')} />
                        <Input label={t('profile_new:mother_salary')} icon="payments" name="motherSalary" type="text" value={formData.motherSalary ? formData.motherSalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('motherSalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                    </div>
                    {formData.motherSalary > 0 && (<div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">₹ {formData.motherSalary.toLocaleString('en-IN')} / {t('common:month')}</span></div>)}
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">groups</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:siblings')}</h3></div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                        <label className="flex gap-1 items-center text-rosewood/80 font-heading font-semibold text-xs">{t('profile_new:no_of_brothers')}</label>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => updateField('noOfBrothers', Math.max(0, (formData.noOfBrothers || 0) - 1))} disabled={(formData.noOfBrothers || 0) <= 0} className="size-10 flex items-center justify-center rounded-xl border border-gold/30 bg-ivory text-rosewood/70 shadow-sm hover:bg-gold-soft/10 hover:text-rosewood hover:border-gold transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-2xl font-black text-rosewood">{formData.noOfBrothers || 0}</span>
                            </div>
                            <button type="button" onClick={() => updateField('noOfBrothers', Math.min(10, (formData.noOfBrothers || 0) + 1))} disabled={(formData.noOfBrothers || 0) >= 10} className="size-10 flex items-center justify-center rounded-xl bg-rosewood text-white shadow-sm hover:brightness-110 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex gap-1 items-center text-rosewood/80 font-heading font-semibold text-xs">{t('profile_new:no_of_sisters')}</label>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => updateField('noOfSisters', Math.max(0, (formData.noOfSisters || 0) - 1))} disabled={(formData.noOfSisters || 0) <= 0} className="size-10 flex items-center justify-center rounded-xl border border-gold/30 bg-ivory text-rosewood/70 shadow-sm hover:bg-gold-soft/10 hover:text-rosewood hover:border-gold transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-2xl font-black text-rosewood">{formData.noOfSisters || 0}</span>
                            </div>
                            <button type="button" onClick={() => updateField('noOfSisters', Math.min(10, (formData.noOfSisters || 0) + 1))} disabled={(formData.noOfSisters || 0) >= 10} className="size-10 flex items-center justify-center rounded-xl bg-rosewood text-white shadow-sm hover:brightness-110 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step6Assets
// ═══════════════════════════════════════════════════════════

const Step6Assets: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-2xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">real_estate_agent</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.property')}</h3></div>
                <div className="p-6 space-y-8">
                    <div className="max-w-md"><Toggle label={t('profile_new:residence')} value={formData.residence || ''} onChange={(val) => updateField('residence', val)} options={RESIDENCE_OPTIONS} name="residence" required /></div>
                    <TranslatableTextarea label={t('profile_new:property_details')} valueEn={formData.propertyDetailsEn || ''} valueTa={formData.propertyDetailsTa || ''} onChangeEn={(val) => updateField('propertyDetailsEn', val)} onChangeTa={(val) => updateField('propertyDetailsTa', val)} placeholder={t('profile_new:placeholders.property')} icon="real_estate_agent" />
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-2xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">favorite</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.expectations')}</h3></div>
                <div className="p-6"><TranslatableTextarea label={t('profile_new:expectation')} valueEn={formData.expectationEn || ''} valueTa={formData.expectationTa || ''} onChangeEn={(val) => updateField('expectationEn', val)} onChangeTa={(val) => updateField('expectationTa', val)} placeholder={t('profile_new:placeholders.partner_expectations')} icon="favorite" /></div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step1Horoscope
// ═══════════════════════════════════════════════════════════

const Step1Horoscope: React.FC<StepProps & { isUploading?: boolean; uploadingType?: string | null; onFileUpload: (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; draftId?: string | null; }> = ({ formData, updateField, onAction, isUploading: parentIsUploading, uploadingType, onFileUpload, onFileDelete, draftId }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    const [activeMethod, setActiveMethod] = useState<'CREATE' | 'UPLOAD' | 'none'>(() => formData.astrology?.mode || 'none');
    const [isGenerating, setIsGenerating] = useState(false);
    const isUploading = parentIsUploading || false;
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [birthTime, setBirthTime] = useState(formData.astrology?.birthTime || '');
    const [birthPlace, setBirthPlace] = useState<{ name: string; lat?: number; lon?: number }>({ name: formData.astrology?.birthPlaceName || '', lat: formData.astrology?.latitude, lon: formData.astrology?.longitude });
    const generateHoroscope = useGenerateHoroscope();

    const handleMethodSelect = (method: 'CREATE' | 'UPLOAD') => { setActiveMethod(method); updateField('astrology', { ...formData.astrology, mode: method }); };
    const handleResetMethod = () => { setIsRegenerating(true); setActiveMethod('none'); updateField('astrology', { ...formData.astrology, mode: 'none' }); };
    const handleStartRegeneration = () => setIsRegenerating(true);

    const handleGenerate = async () => {
        if (!formData.dob || !birthTime || !birthPlace.name) { toast.error(t('profile_new:toasts.error_missing_birth_details')); return; }
        setIsGenerating(true);
        try {
            const result = await generateHoroscope.mutateAsync({
                dateOfBirth: formData.dob,
                timeOfBirth: birthTime,
                location: { displayName: birthPlace.name, latitude: birthPlace.lat ?? 0, longitude: birthPlace.lon ?? 0 },
                draftId: draftId || undefined,
            });
            updateField('astrology', { ...formData.astrology, mode: 'CREATE', birthTime, birthPlaceName: result.summary.locationName || birthPlace.name, birthLatitude: result.input.location.latitude, birthLongitude: result.input.location.longitude, timezone: result.meta.timezone, ayanamsa: result.meta.ayanamsa, horoscopeJson: result, generatedAt: new Date().toISOString() });
            setIsRegenerating(false);
            toast.success(t('profile_new:toasts.horoscope_generated'));
        } catch { toast.error(t('profile_new:toasts.error_generating_horoscope')); } finally { setIsGenerating(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'rasi' | 'navamsa' | 'full') => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            if (target === 'full') { await onFileUpload(file, 'rasi'); } else { await onFileUpload(file, target as any); }
            if (formData.astrology?.rasiChartUrl && formData.astrology?.navamsaChartUrl) setIsRegenerating(false);
        } catch (error: any) { console.error('Horoscope upload error:', error); }
    };

    const handleBackFromMethod = () => { setActiveMethod('none'); updateField('astrology', { ...formData.astrology, mode: 'none' }); };
    const hasExistingData = (activeMethod === 'CREATE' && (formData.astrology?.rasi || formData.astrology?.navamsa || formData.astrology?.horoscopeJson)) || (activeMethod === 'UPLOAD' && ((formData.astrology?.rasiChartUrl && formData.astrology?.navamsaChartUrl) || formData.astrology?.chartUrl));

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AnimatePresence mode="wait">
                {activeMethod === 'none' ? (<HoroscopeMethodSelector onSelect={handleMethodSelect} />) : (
                    <motion.div key="active" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="space-y-8">
                        {(isRegenerating || !hasExistingData) && (<div className="flex items-center justify-between"><button type="button" onClick={handleResetMethod} className="size-10 bg-white border border-gold-soft/20 rounded-xl flex items-center justify-center text-rosewood hover:border-rosewood transition-all hover:shadow-lg shadow-black/5"><span className="material-symbols-outlined text-sm font-black">arrow_back</span></button><div className="space-y-0.5 text-right"><h3 className="text-xs font-black tracking-widest text-rosewood uppercase leading-none">{activeMethod === 'CREATE' ? t('profile_new:horoscope.auto_generate') : t('profile_new:horoscope.upload_chart')}</h3><p className="text-[10px] text-slate-400 font-bold tracking-widest italic leading-none">{t('profile_new:sections.horoscope_main')}</p></div></div>)}
                        <div className="">
                            {hasExistingData && !isRegenerating ? (<HoroscopeResultsView mode={activeMethod} result={formData.astrology?.horoscopeJson ? (typeof formData.astrology.horoscopeJson === 'string' ? JSON.parse(formData.astrology.horoscopeJson) : formData.astrology.horoscopeJson) : undefined} rasi={activeMethod === 'CREATE' ? formData.astrology?.rasi : formData.astrology?.rasiChartUrl} navamsa={activeMethod === 'CREATE' ? formData.astrology?.navamsa : formData.astrology?.navamsaChartUrl} profileName={[formData.firstNameTa, formData.lastNameTa].filter(Boolean).join(' ') || [formData.firstNameEn, formData.lastNameEn].filter(Boolean).join('') || ''} onRegenerate={handleStartRegeneration} />) : activeMethod === 'CREATE' ? (<HoroscopeAutoForm dob={formData.dob} onDobChange={(val) => updateField('dob', val)} birthTime={birthTime} onBirthTimeChange={setBirthTime} birthPlaceName={birthPlace.name} onBirthPlaceChange={setBirthPlace} onGenerate={handleGenerate} isGenerating={isGenerating} />) : (<HoroscopeUploadForm onFileUpload={handleFileUpload} onFileDelete={onFileDelete} rasiChartUrl={formData.astrology?.rasiChartUrl} navamsaChartUrl={formData.astrology?.navamsaChartUrl} fullChartUrl={formData.astrology?.chartUrl} isUploading={isUploading} uploadingType={uploadingType} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step7Gallery
// ═══════════════════════════════════════════════════════════

const Step7Gallery: React.FC<StepProps & { isUploading?: boolean; uploadingType?: string | null; onFileUpload: (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; }> = ({ formData, updateField, onAction, isUploading = false, uploadingType, onFileUpload, onFileDelete }) => {
    const { t } = useTranslation(['profile_new', 'common']);

    const handleFileChange = async (index: number, file: File | null) => { if (!file) { await onFileDelete('gallery', index); return; } await onFileUpload(file, 'gallery'); };
    const handleProfilePhoto = async (file: File | null) => { if (!file) { await onFileDelete('photo'); return; } await onFileUpload(file, 'photo'); };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
            <div className="bg-white border border-gold-soft/10 rounded-3xl shadow-sm shadow-black/2 transition-all hover:shadow-md hover:shadow-black/5">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-3xl flex items-center justify-between"><div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">account_circle</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:gallery.portrait_title')}</h3></div></div>
                <div className="p-8 flex flex-col items-center">
                    <div className="relative group/portrait">
                        <div className={`size-48 rounded-xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden ${formData.profilePhoto ? 'border-rosewood shadow-2xl shadow-rosewood/10 ring-8 ring-rosewood/5' : 'border-slate-200 bg-slate-50 hover:bg-ivory/50'}`}>
                            {formData.profilePhoto ? (<img src={typeof formData.profilePhoto === 'string' ? formData.profilePhoto : URL.createObjectURL(formData.profilePhoto)} alt="Profile preview" className="w-full h-full object-cover" />) : (<div className="text-center p-6"><span className="material-symbols-outlined text-5xl text-rosewood/20 mb-2 block group-hover/portrait:scale-110 group-hover/portrait:text-rosewood transition-all duration-500">add_a_photo</span><p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{t('profile_new:gallery.upload_main')}</p></div>)}
                            {isUploading && uploadingType === 'photo' && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30"><span className="material-symbols-outlined text-4xl text-rosewood animate-spin mb-2">autorenew</span><p className="text-[8px] animate-pulse text-rosewood font-black tracking-widest uppercase">Processing...</p></div>)}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" disabled={isUploading} onChange={(e) => handleProfilePhoto(e.target.files?.[0] || null)} />
                            {formData.profilePhoto && !isUploading && (<div className="absolute inset-0 bg-rosewood/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/portrait:opacity-100 transition-all duration-500 z-10"><div className="size-16 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white scale-75 group-hover/portrait:scale-100 transition-all duration-500"><span className="material-symbols-outlined text-3xl animate-spin-slow">autorenew</span></div></div>)}
                        </div>
                        {formData.profilePhoto && !isUploading && (<button onClick={() => handleProfilePhoto(null)} className="absolute -top-2 -right-2 size-8 bg-white text-rosewood rounded-full shadow-lg border border-slate-100 flex items-center justify-center z-30 hover:scale-110 active:scale-95 transition-transform"><span className="material-symbols-outlined text-sm!">close</span></button>)}
                    </div>
                    <div className="mt-6 text-center space-y-2"><h4 className="text-sm font-black text-rosewood italic tracking-wider">{t('profile_new:gallery.portrait_title')}</h4><p className="text-[10px] text-slate-400 font-bold tracking-[0.15em] max-w-sm leading-loose">{t('profile_new:gallery.portrait_desc')}</p></div>
                </div>
            </div>
            <div className="bg-white border border-gold-soft/10 rounded-3xl shadow-sm shadow-black/2 transition-all hover:shadow-md hover:shadow-black/5">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft/10 rounded-t-3xl flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">photo_library</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:gallery.lifestyle_title')}</h3></div><div className="px-3 py-1 bg-white/80 border border-gold-soft/20 rounded-full shadow-sm"><span className="text-[10px] font-black text-rosewood/60 tracking-widest uppercase">{(formData.gallery || []).length} / 6</span></div></div>
                <div className="p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {(formData.gallery || []).map((url: string, idx: number) => { const isSlotProcessing = isUploading && uploadingType === `gallery_${idx}`; return (<div key={`img-${idx}`} className="relative aspect-3/4 group/item"><div className="w-full h-full rounded-xl border border-gold-soft/20 shadow-lg overflow-hidden relative"><img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />{isSlotProcessing && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30"><span className="material-symbols-outlined text-2xl text-rosewood animate-spin mb-1">autorenew</span><span className="text-[7px] font-black text-rosewood uppercase tracking-tighter">PROCESSING...</span></div>)}{!isSlotProcessing && (<div className="absolute inset-0 bg-rosewood/40 backdrop-blur-[2px] opacity-0 group-hover/item:opacity-100 transition-all duration-500 flex items-center justify-center z-10"><label className="size-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white cursor-pointer hover:bg-white hover:text-rosewood transition-all duration-500 hover:rotate-180"><span className="material-symbols-outlined text-2xl">autorenew</span><input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={(e) => handleFileChange(idx, e.target.files?.[0] || null)} /></label></div>)}</div>{!isSlotProcessing && (<button onClick={() => handleFileChange(idx, null)} className="absolute -top-1.5 -right-1.5 size-6 bg-white text-rosewood rounded-full shadow-md border border-slate-100 flex items-center justify-center z-20 hover:scale-110 active:scale-90 transition-transform"><span className="material-symbols-outlined text-[12px]!">close</span></button>)}</div>); })}
                        {((formData.gallery || []).length < 6) && (<div className="relative aspect-3/4 group/add"><div className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center space-y-2 group-hover/add:border-gold group-hover/add:bg-ivory transition-all duration-500 relative overflow-hidden">{isUploading && uploadingType === `gallery_${(formData.gallery || []).length}` ? (<div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30"><span className="material-symbols-outlined text-3xl text-rosewood animate-spin mb-1">autorenew</span><span className="text-[7px] font-black text-rosewood uppercase tracking-tighter">SECURE UPLOAD...</span></div>) : (<><span className="material-symbols-outlined text-3xl text-slate-300 group-hover/add:text-gold group-hover/add:scale-110 transition-all">add_a_photo</span><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common:upload')}</span></>)}<input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" disabled={isUploading} onChange={(e) => handleFileChange((formData.gallery || []).length, e.target.files?.[0] || null)} /></div></div>)}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gold-soft/5 text-center"><div className="inline-flex items-center gap-2 px-4 py-2 bg-rosewood/5 rounded-full"><span className="material-symbols-outlined text-rosewood text-sm">water_drop</span><span className="text-[10px] font-black text-rosewood tracking-wider">{t('profile_new:gallery.security_watermark')}</span></div></div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step8Review
// ═══════════════════════════════════════════════════════════

const Step8Review: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const isEn = i18n.language === 'en';

    const calculateAge = (dob: string) => { if (!dob) return '---'; const birthDate = new Date(dob); const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--; return age; };
    const getOptionLabel = (options: any[], value: any, bilingual?: boolean) => {
        if (!value) return null;
        const option = options.find(o => o.value === value);
        if (!option) return value;
        if (bilingual) return getBilingualLabel(option.label, i18n.language as 'en' | 'ta');
        return isEn ? option.label.en : option.label.ta;
    };
    const getLocationLabel = (type: 'district' | 'taluk', value: string) => { if (!value || value === 'OTHER') return value; if (!isEn) { const tamilMap = type === 'district' ? DISTRICT_TAMIL : TALUK_TAMIL; return tamilMap[value] || value; } return value.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); };

    const renderSection = (title: string, icon: string, items: { label: string; value: any; fullWidth?: boolean }[], children?: React.ReactNode) => (
        <div className="bg-white border border-gold-soft/10 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
            <div className="bg-ivory/50 px-6 py-3 border-b border-gold-soft/10 flex items-center gap-3 shrink-0"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">{icon}</span></div><h3 className="text-xs font-black tracking-widest text-rosewood uppercase">{title}</h3></div>
            <div className="p-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">{items.map((item, idx) => (<div key={idx} className={`${item.fullWidth ? 'md:col-span-2' : ''} space-y-1`}><p className="text-rosewood/80 font-heading font-semibold text-[10px]">{item.label}</p><div className="text-sm font-bold text-slate-700 leading-relaxed">{(item.value !== undefined && item.value !== null && item.value !== '') ? item.value : (<span className="text-slate-300 italic font-medium">{t('common:profile.not_specified')}</span>)}</div></div>))}</div>
                {children && <div className="mt-8 pt-6 border-t border-gold-soft/10">{children}</div>}
            </div>
        </div>
    );

    const isCreateMode = formData.astrology?.mode === 'CREATE';
    const horoscopeData = formData.astrology?.horoscopeJson
        ? (typeof formData.astrology.horoscopeJson === 'string' ? JSON.parse(formData.astrology.horoscopeJson) : formData.astrology.horoscopeJson) as HoroscopeResult
        : null;
    const allPhotos = [...(formData.profilePhoto ? [{ id: 'portrait', url: typeof formData.profilePhoto === 'string' ? formData.profilePhoto : URL.createObjectURL(formData.profilePhoto), label: t('profile_new:gallery.portrait_title') }] : []), ...(formData.gallery || []).map((item: any, idx: number) => ({ id: `gallery-${idx}`, url: typeof item === 'string' ? item : URL.createObjectURL(item), label: `${t('profile_new:gallery.lifestyle_title')} ${idx + 1}` }))];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
            <div className="bg-ivory border border-gold/20 rounded-2xl p-5 flex items-center gap-5 shadow-sm"><div className="size-11 bg-rosewood/5 rounded-xl flex items-center justify-center text-rosewood shrink-0"><span className="material-symbols-outlined text-2xl!">info</span></div><div className="space-y-0.5"><p className="text-xs font-black tracking-widest text-rosewood/40 uppercase">{t('profile_new:review.warning_title')}</p><p className="text-sm font-bold text-rosewood tracking-wide leading-snug">{t('profile_new:review.warning_desc')}</p></div></div>
            <div className="bg-rosewood rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-rosewood/20 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-30 active:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                    <div className="relative shrink-0">
                        <div className="w-32 md:w-36 aspect-4/5 rounded-xl overflow-hidden bg-ivory ring-[3px] ring-gold/20 shadow-2xl relative group-hover:ring-gold/40 transition-all duration-500 p-0.5">
                            {formData.profilePhoto ? (<img src={typeof formData.profilePhoto === 'string' ? formData.profilePhoto : URL.createObjectURL(formData.profilePhoto)} alt="Profile" className="w-full h-full object-cover rounded-[10px] transition-transform duration-700 group-hover:scale-110" />) : (<div className="w-full h-full rounded-[10px] overflow-hidden"><svg viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><defs><linearGradient id="avatar_gradient" x1="0" y1="0" x2="200" y2="250" gradientUnits="userSpaceOnUse"><stop stopColor="#8B1D3D" /><stop offset="1" stopColor="#7A1935" /></linearGradient></defs><rect width="200" height="250" fill="url(#avatar_gradient)" /><text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#D4AF37" fontFamily="serif" fontWeight="900" fontSize="72" letterSpacing="2">{(formData.firstNameEn || formData.firstNameTa || '?')[0].toUpperCase()}</text></svg></div>)}
                            <div className="absolute -bottom-2 -right-2 size-10 bg-gold rounded-xl flex items-center justify-center text-white shadow-lg shadow-gold/40 border-2 border-rosewood rotate-12 group-hover:rotate-0 transition-transform z-10"><span className="material-symbols-outlined text-xl">verified</span></div>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4 pt-2">
                        <div className="space-y-1"><span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-white/10">{t('profile_new:sections.connection')}</span><h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black tracking-tight leading-tight">{isEn ? ([formData.firstNameEn, formData.lastNameEn].filter(Boolean).join(' ') || t('common:profile.not_specified')) : ([formData.firstNameTa, formData.lastNameTa].filter(Boolean).join(' ') || [formData.firstNameEn, formData.lastNameEn].filter(Boolean).join(' ') || t('common:profile.not_specified'))}</h2></div>
                        <div className="h-px w-24 bg-linear-to-r from-gold/60 to-transparent mb-4 mx-auto md:mx-0"></div>
                        <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed max-w-2xl">{t('profile_new:review.hero_desc')}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm"><span className="material-symbols-outlined text-gold text-lg">cake</span><span className="text-[11px] font-bold uppercase tracking-widest leading-none pt-0.5">{formData.dob ? `${calculateAge(formData.dob)} ${t('common:yrs')}` : '---'}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm"><span className="material-symbols-outlined text-gold text-lg">location_on</span><span className="text-[11px] font-bold uppercase tracking-widest leading-none pt-0.5">{(formData.currentDistrict === 'OTHER') ? (isEn ? formData.currentCityEn : (formData.currentCityTa || formData.currentCityEn)) : getLocationLabel('district', formData.currentDistrict)}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderSection(t('profile_new:sections.connection'), 'person', [
                    { label: t('profile_new:full_name'), value: isEn ? [formData.firstNameEn, formData.lastNameEn].filter(Boolean).join(' ') : ([formData.firstNameTa, formData.lastNameTa].filter(Boolean).join(' ') || [formData.firstNameEn, formData.lastNameEn].filter(Boolean).join(' ')) },
                    { label: t('profile_new:gender'), value: getOptionLabel(GENDER_OPTIONS, formData.gender) },
                    { label: t('profile_new:dob'), value: formData.dob ? new Date(formData.dob).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                    { label: t('profile_new:marital_status'), value: getOptionLabel(MARITAL_STATUS_OPTIONS, formData.maritalStatus) },
                    { label: t('profile_new:height'), value: getOptionLabel(HEIGHT_OPTIONS, formData.height) },
                    { label: t('profile_new:weight'), value: formData.weight ? `${formData.weight} kg` : null },
                    { label: t('profile_new:blood_group'), value: getOptionLabel(BLOOD_GROUP_OPTIONS, formData.bloodGroup) },
                    { label: t('profile_new:diet'), value: getOptionLabel(DIET_OPTIONS, formData.diet) },
                    { label: t('profile_new:complexion'), value: getOptionLabel(COMPLEXION_OPTIONS, formData.complexion) },
                ])}
                {renderSection(t('profile_new:sections.community'), 'temple_hindu', [
                    { label: t('profile_new:caste'), value: t('profile_new:caste_val') },
                    { label: t('profile_new:sub_caste'), value: t('profile_new:community_val') },
                    { label: t('profile_new:kulam'), value: getOptionLabel(KULAM_OPTIONS, formData.kulam) },
                    { label: t('profile_new:kuladeivam'), value: isEn ? formData.kuladeivamEn : (formData.kuladeivamTa || formData.kuladeivamEn) },
                    { label: t('profile_new:star'), value: getOptionLabel(NAKSHATRA_OPTIONS, formData.star, true) },
                    { label: t('profile_new:rasi'), value: getOptionLabel(RASI_OPTIONS, formData.rasi, true) },
                    { label: t('profile_new:dosham'), value: getOptionLabel(DOSHAM_OPTIONS, formData.dosham) },
                ])}
                {renderSection(t('profile_new:professional_details'), 'work', [
                    { label: t('profile_new:education'), value: formData.education, fullWidth: true },
                    { label: t('profile_new:job_sector'), value: getOptionLabel(JOB_SECTOR_OPTIONS, formData.jobSector) },
                    { label: t('profile_new:job_detail'), value: formData.jobDetail },
                    { label: t('profile_new:salary_monthly'), value: formData.salaryMonthly ? `₹${formData.salaryMonthly.toLocaleString()}` : null },
                    { label: t('profile_new:job_location'), value: isEn ? formData.jobLocationEn : (formData.jobLocationTa || formData.jobLocationEn) },
                ])}
                {renderSection(t('profile_new:sections.locations'), 'location_on', [
                    { label: t('profile_new:current_district'), value: formData.currentDistrict === 'OTHER' ? (isEn ? formData.currentDistrictEn : (formData.currentDistrictTa || formData.currentDistrictEn)) : getLocationLabel('district', formData.currentDistrict) },
                    { label: t('profile_new:current_taluk'), value: formData.currentDistrict === 'OTHER' ? (isEn ? formData.currentCityEn : (formData.currentCityTa || formData.currentCityEn)) : getLocationLabel('taluk', formData.currentTaluk) },
                    { label: t('profile_new:native_district'), value: getLocationLabel('district', formData.nativeDistrict) },
                    { label: t('profile_new:native_taluk'), value: getLocationLabel('taluk', formData.nativeTaluk) },
                ])}
                {renderSection(t('profile_new:family_details'), 'family_restroom', [
                    { label: t('profile_new:father_name'), value: (isEn ? formData.fatherNameEn : (formData.fatherNameTa || formData.fatherNameEn)) + (formData.fatherIsLate ? ` (${t('profile_new:is_late')})` : '') },
                    { label: t('profile_new:father_job'), value: formData.fatherJob },
                    { label: t('profile_new:mother_name'), value: (isEn ? formData.motherNameEn : (formData.motherNameTa || formData.motherNameEn)) + (formData.motherIsLate ? ` (${t('profile_new:is_late')})` : '') },
                    { label: t('profile_new:mother_job'), value: formData.motherJob },
                    { label: t('profile_new:no_of_brothers'), value: formData.noOfBrothers ?? 0 },
                    { label: t('profile_new:no_of_sisters'), value: formData.noOfSisters ?? 0 },
                    { label: t('profile_new:father_salary'), value: formData.fatherSalary ? `₹${formData.fatherSalary.toLocaleString()}` : null },
                    { label: t('profile_new:mother_salary'), value: formData.motherSalary ? `₹${formData.motherSalary.toLocaleString()}` : null },
                ])}
                {renderSection(t('profile_new:sections.property'), 'real_estate_agent', [
                    { label: t('profile_new:residence'), value: getOptionLabel(RESIDENCE_OPTIONS, formData.residence), fullWidth: true },
                    { label: t('profile_new:property_details'), value: isEn ? formData.propertyDetailsEn : (formData.propertyDetailsTa || formData.propertyDetailsEn), fullWidth: true },
                    { label: t('profile_new:expectation'), value: isEn ? formData.expectationEn : (formData.expectationTa || formData.expectationEn), fullWidth: true },
                ])}
            </div>

            <div className="w-full">{renderSection(t('profile_new:sections.horoscope_main'), 'auto_awesome', [{ label: t('profile_new:review.chart_generation'), value: isCreateMode ? t('profile_new:review.auto_generated') : t('profile_new:review.manually_uploaded') }], (<div className="space-y-6">{(!formData.astrology?.mode) ? (<div className="bg-ivory/30 border-2 border-dashed border-gold-soft/20 rounded-xl p-12 text-center"><span className="material-symbols-outlined text-4xl text-slate-300 mb-2">auto_awesome_motion</span><p className="text-sm font-bold text-slate-400 italic">{t('common:profile.not_specified')}</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:px-12"><div className="space-y-4"><p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest text-center">{t('profile_new:horoscope.rasi_chart')}</p><div className="bg-ivory/20 rounded-xl p-4 ring-1 ring-gold-soft/10 shadow-inner">{isCreateMode && horoscopeData ? (<D1Chart lagnaSign={horoscopeData.lagna.signIndex} planets={horoscopeData.planets} />) : (<div className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm ring-4 ring-white">{formData.astrology?.rasiChartUrl ? (<img src={formData.astrology.rasiChartUrl} alt="Rasi" className="w-full h-full object-contain" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">{t('common:profile.not_specified')}</div>)}</div>)}</div></div><div className="space-y-4"><p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest text-center">{t('profile_new:horoscope.navamsa_chart')}</p><div className="bg-ivory/20 rounded-xl p-4 ring-1 ring-gold-soft/10 shadow-inner">{isCreateMode && horoscopeData ? (<D9Chart planets={horoscopeData.planets} lagnaNavamsaSignIndex={horoscopeData.lagnaNavamsa.signIndex} />) : (<div className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm ring-4 ring-white">{formData.astrology?.navamsaChartUrl ? (<img src={formData.astrology.navamsaChartUrl} alt="Navamsa" className="w-full h-full object-contain" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">{t('common:profile.not_specified')}</div>)}</div>)}</div></div></div>)}</div>))}</div>

            <div className="w-full">{renderSection(t('profile_new:sections.media'), 'photo_library', [], (<div className="space-y-6">{allPhotos.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">{allPhotos.map((photo) => (<div key={photo.id} className="space-y-2"><div className="aspect-3/4 rounded-xl overflow-hidden bg-slate-100 ring-2 ring-white shadow-md relative group"><img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />{photo.id === 'portrait' && (<div className="absolute top-2 left-2 px-2 py-0.5 bg-rosewood/90 text-[7px] font-black text-white uppercase rounded tracking-widest shadow-lg">{t('profile_new:review.photo_main')}</div>)}</div><p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center truncate px-1">{photo.label}</p></div>))}</div>) : (<div className="bg-ivory/30 border-2 border-dashed border-gold-soft/20 rounded-xl p-12 text-center"><span className="material-symbols-outlined text-4xl text-slate-300 mb-2">no_photography</span><p className="text-sm font-bold text-slate-400 italic">{t('common:profile.not_specified')}</p></div>)}</div>))}</div>

            <div className="bg-ivory shadow-xl shadow-gold/5 border border-gold-soft/20 rounded-3xl p-8 md:p-12 text-center space-y-6">
                <div className="size-20 bg-white rounded-xl flex items-center justify-center text-gold mx-auto shadow-inner border border-gold/10"><span className="material-symbols-outlined text-4xl">verified_user</span></div>
                <div className="space-y-3"><h3 className="text-2xl font-serif font-bold text-rosewood">{t('profile_new:review.confirm_title')}</h3><p className="text-sm text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">{t('profile_new:review.confirm_desc')}</p></div>
                <div className="pt-4 max-w-full mx-auto">
                    <label className="flex items-start gap-3 p-4 bg-white border border-gold-soft/30 rounded-xl cursor-pointer transition-all hover:border-gold group text-left">
                        <div className="relative flex items-center pt-1"><input type="checkbox" checked={formData.agreedToTerms || false} onChange={(e) => updateField('agreedToTerms', e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:bg-rosewood checked:border-rosewood outline-none" /><span className="absolute text-white material-symbols-outlined text-sm! opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">check</span></div>
                        <div className="flex-1"><p className="text-sm font-bold text-slate-700 leading-snug">{t('profile_new:review.terms_notice')}</p><p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">{t('profile_new:review.terms_sub')}</p></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// NewProfile (Main Page)
// ═══════════════════════════════════════════════════════════

const NewProfile: React.FC = () => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { formData, updateField, reset, isDirty, setIsDirty, setFormData, restoreDraft } = useProfileForm();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(searchParams.get('draftId'));
    const hasSavedOnceRef = useRef(false);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const totalSteps = 8;

    const saveDraftMutation = useSaveDraftMutation();
    const { data: draftData, isLoading: isLoadingDraft } = useResumeDraftQuery(draftId);
    const publishMutation = usePublishProfileMutation();
    const cancelDraftMutation = useCancelDraftMutation();
    const uploadMutation = useUploadProfileImageMutation();
    const deleteImageMutation = useDeleteProfileImageMutation();

    useScrollToTop([currentStep]);
    const prevIdRef = React.useRef<string | null>(searchParams.get('draftId'));

    useEffect(() => {
        const id = searchParams.get('draftId');
        const prevId = prevIdRef.current;
        if (prevId && !id) { reset(); setCurrentStep(1); hasSavedOnceRef.current = false; }
        setDraftId(id);
        prevIdRef.current = id;
    }, [searchParams, reset]);

    useEffect(() => {
        if (draftData) {
            restoreDraft(draftData);
        }
    }, [draftData, restoreDraft]);

    const steps = [
        { title: t('common:setup.step1.title'), icon: 'person' },
        { title: t('common:setup.step2.title'), icon: 'temple_hindu' },
        { title: t('common:setup.step3.title'), icon: 'school' },
        { title: t('common:setup.step4.title'), icon: 'family_restroom' },
        { title: t('common:setup.step5.title'), icon: 'account_balance' },
        { title: t('common:setup.step6.title'), icon: 'auto_awesome' },
        { title: t('common:setup.step7.title'), icon: 'photo_library' },
        { title: t('common:setup.step8.title'), icon: 'verified' },
    ];

    const isNavigatingRef = React.useRef(false);

    const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && !isNavigatingRef.current && currentLocation.pathname !== nextLocation.pathname);
    React.useEffect(() => { if (blocker.state === "blocked") setShowDraftModal(true); }, [blocker.state]);

    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isNavigatingRef.current) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const isEn = i18n.language === 'en';

    const validateStep = (step: number) => {
        const errors: string[] = [];
        const checkRequired = (fields: string[]) => {
            fields.forEach(field => {
                const val = (formData as any)[field];
                if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                    const labelKey = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    const label = t(`profile_new:${labelKey}`) || field;
                    errors.push(isEn ? `${label} is required` : `${label} கட்டாயம்`);
                }
            });
        };
        const checkRange = (fields: string[], min: number, max: number) => {
            fields.forEach(field => {
                const val = (formData as any)[field];
                if (val !== undefined && val !== null && val !== '') {
                    const num = Number(val);
                    if (num < min || num > max) {
                        const labelKey = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                        const label = t(`profile_new:${labelKey}`) || field;
                        errors.push(isEn ? `${label} must be between ${min} and ${max}` : `${label} ${min} மற்றும் ${max} வரை இருக்க வேண்டும்`);
                    }
                }
            });
        };
        const checkNonNegative = (fields: string[]) => {
            fields.forEach(field => {
                const val = (formData as any)[field];
                if (val !== undefined && val !== null && Number(val) < 0) {
                    const labelKey = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    const label = t(`profile_new:${labelKey}`) || field;
                    errors.push(isEn ? `${label} must be a non-negative number` : `${label} மெய் எண்ணாக இருக்க வேண்டும்`);
                }
            });
        };

        switch (step) {
            case 1:
                checkRequired(['profileFor', 'gender', 'maritalStatus', 'currentDistrict', 'nativeDistrict', 'nativeTaluk', 'bloodGroup', 'height', 'weight', 'diet']);
                if (formData.currentDistrict === 'OTHER') checkRequired(['currentDistrictEn', 'currentCityEn', 'currentStateEn', 'currentCountryEn']);
                else checkRequired(['currentTaluk']);
                if (!formData.firstNameEn || formData.firstNameEn.trim().length < 2) errors.push(isEn ? 'First name must be at least 2 characters long' : 'முதல் பெயர் குறைந்தபட்சம் 2 எழுத்துக்கள் இருக்க வேண்டும்');
                if (!formData.lastNameEn || formData.lastNameEn.trim().length < 2) errors.push(isEn ? 'Last name must be at least 2 characters long' : 'கடைசி பெயர் குறைந்தபட்சம் 2 எழுத்துக்கள் இருக்க வேண்டும்');
                checkNonNegative(['weight']); checkRange(['height'], 120, 240);
                break;
            case 2:
                checkRequired(['kulam', 'star', 'rasi', 'laganam']);
                if (!formData.kuladeivamEn && !formData.kuladeivamTa) errors.push(isEn ? 'Kuladeivam is required' : 'குலதெய்வம் கட்டாயம்');
                break;
            case 3:
                checkNonNegative(['salaryMonthly']);
                break;
            case 4:
                checkRequired(['fatherNameEn', 'motherNameEn']);
                if (formData.noOfBrothers === undefined || formData.noOfBrothers === null || (formData.noOfBrothers as any) === '') errors.push(isEn ? 'Number of brothers is required' : 'சகோதரர்களின் எண்ணிக்கை கட்டாயம்');
                if (formData.noOfSisters === undefined || formData.noOfSisters === null || (formData.noOfSisters as any) === '') errors.push(isEn ? 'Number of sisters is required' : 'சகோதரிகளின் எண்ணிக்கை கட்டாயம்');
                checkNonNegative(['noOfBrothers', 'noOfSisters']);
                break;
            case 5:
                checkRequired(['residence']);
                break;
            case 6:
                if (!formData.dob) errors.push(isEn ? 'Date of Birth is required' : t('profile_new:dob') + ' கட்டாயம்');
                const astro = formData.astrology;
                if (!astro || !astro.mode || astro.mode === 'none') errors.push(isEn ? 'Please select a horoscope generation method' : 'ஜாதக முறையைத் தேர்ந்தெடுக்கவும்');
                else if (astro.mode === 'CREATE') {
                    if (!formData.dob) errors.push(isEn ? 'Date of Birth is required for auto-generation' : 'தானியங்கி உருவாக்கத்திற்கு பிறந்த தேதி தேவை');
                } else if (astro.mode === 'UPLOAD') {
                    const hasFiles = astro.chartUrl || (astro.rasiChartUrl && astro.navamsaChartUrl) || astro.fileName;
                    if (!hasFiles) errors.push(isEn ? 'Please upload your horoscope files' : 'தயவுசெய்து ஜாதகத்தை பதிவேற்றவும்');
                }
                break;
            case 7:
                break;
            case 8:
                if (!formData.agreedToTerms) errors.push(isEn ? 'You must agree to the terms to proceed' : 'நீங்கள் விதிமுறைகளை ஏற்க வேண்டும்');
                break;
        }
        return errors;
    };

    const handleNext = () => {
        const stepErrors = validateStep(currentStep);
        if (stepErrors.length > 0) { toast.error(stepErrors[0]); return; }
        if (currentStep < totalSteps) {
            setCurrentStep((prev: number) => prev + 1);
            if (hasSavedOnceRef.current && draftId) {
                triggerAutoSave();
            }
        }
    };

    const handleBack = () => { if (currentStep > 1) setCurrentStep((prev: number) => prev - 1); else navigate(-1); };

    const buildDraftPayload = () => ({
        draftId: draftId || undefined,
        currentStep,
        draftData: {
            basic: {
                profileFor: formData.profileFor,
                firstNameEn: formData.firstNameEn,
                firstNameTa: formData.firstNameTa,
                lastNameEn: formData.lastNameEn,
                lastNameTa: formData.lastNameTa,
                gender: formData.gender,
                dob: formData.dob,
            },
            personal: {
                maritalStatus: formData.maritalStatus,
                diet: formData.diet,
                bloodGroup: formData.bloodGroup,
                height: formData.height,
                weight: formData.weight,
                complexion: formData.complexion,
                currentDistrict: formData.currentDistrict,
                currentTaluk: formData.currentTaluk,
                currentDistrictEn: formData.currentDistrictEn,
                currentDistrictTa: formData.currentDistrictTa,
                currentCityEn: formData.currentCityEn,
                currentCityTa: formData.currentCityTa,
                currentStateEn: formData.currentStateEn,
                currentStateTa: formData.currentStateTa,
                currentCountryEn: formData.currentCountryEn,
                currentCountryTa: formData.currentCountryTa,
                nativeDistrict: formData.nativeDistrict,
                nativeTaluk: formData.nativeTaluk,
            },
            community: {
                kulam: formData.kulam,
                kuladeivamEn: formData.kuladeivamEn,
                kuladeivamTa: formData.kuladeivamTa,
                star: formData.star,
                rasi: formData.rasi,
                lagnam: formData.lagnam,
                dosham: formData.dosham,
            },
            professional: {
                education: formData.education,
                jobSector: formData.jobSector,
                jobDetail: formData.jobDetail,
                salaryMonthly: formData.salaryMonthly,
                companyName: formData.companyName,
                jobLocationEn: formData.jobLocationEn,
                jobLocationTa: formData.jobLocationTa,
            },
            family: {
                fatherNameEn: formData.fatherNameEn,
                fatherNameTa: formData.fatherNameTa,
                fatherJob: formData.fatherJob,
                fatherSalary: formData.fatherSalary,
                fatherIsLate: formData.fatherIsLate,
                motherNameEn: formData.motherNameEn,
                motherNameTa: formData.motherNameTa,
                motherJob: formData.motherJob,
                motherSalary: formData.motherSalary,
                motherIsLate: formData.motherIsLate,
                noOfBrothers: formData.noOfBrothers,
                noOfSisters: formData.noOfSisters,
            },
            assets: {
                residence: formData.residence,
                propertyDetailsEn: formData.propertyDetailsEn,
                propertyDetailsTa: formData.propertyDetailsTa,
                expectationEn: formData.expectationEn,
                expectationTa: formData.expectationTa,
            },
            gallery: formData.gallery,
            profilePhoto: formData.profilePhoto,
        },
        birthData: formData.astrology?.mode === 'CREATE' ? {
            dateOfBirth: formData.dob,
            timeOfBirth: formData.astrology?.birthTime,
            location: {
                displayName: formData.astrology?.birthPlaceName || '',
                latitude: formData.astrology?.birthLatitude || 0,
                longitude: formData.astrology?.birthLongitude || 0,
            },
        } : undefined,
        horoscopeJson: formData.astrology?.horoscopeJson,
        inputHash: formData.astrology?.inputHash,
    });

    const triggerAutoSave = () => {
        if (!draftId || !hasSavedOnceRef.current) return;
        saveDraftMutation.mutate(buildDraftPayload());
    };

    useEffect(() => {
        if (hasSavedOnceRef.current && isDirty && draftId) {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(triggerAutoSave, 3000);
        }
        return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    }, [formData, isDirty, draftId]);

    const handleImageUpload = async (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => {
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) { toast.error(i18n.language === 'ta' ? 'படம் 5MB-க்கு குறைவாக இருக்க வேண்டும்' : 'Image size must be less than 5MB'); return; }
        const activeUploadingType = type === 'gallery' ? `gallery_${index ?? 0}` : type;
        setUploadingType(activeUploadingType);
        try {
            let activeId = draftId;
            if (!activeId) {
                const payload = buildDraftPayload();
                const res = await saveDraftMutation.mutateAsync(payload);
                activeId = res.data.draftId;
                setDraftId(activeId);
                hasSavedOnceRef.current = true;
            }
            const res = await uploadMutation.mutateAsync({ id: activeId, type, file, index });
            const url = res.data.url;
            if (type === 'photo') updateField('profilePhoto', url);
            else if (type === 'rasi' || type === 'navamsa') updateField('astrology' as any, { ...formData.astrology, [type === 'rasi' ? 'rasiChartUrl' : 'navamsaChartUrl']: url });
            else { const currentGallery = [...(formData.gallery || [])]; if (index !== undefined && index < currentGallery.length) currentGallery[index] = url; else currentGallery.push(url); updateField('gallery', currentGallery); }
            toast.success(t('profile_new:toasts.upload_success'));
        } catch (error: any) { toast.error(error.message || t('profile_new:toasts.upload_error')); } finally { setUploadingType(null); }
    };

    const handleImageDelete = async (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => {
        if (!draftId) {
            if (type === 'photo') updateField('profilePhoto', null);
            else if (type === 'rasi' || type === 'navamsa') updateField('astrology' as any, { ...formData.astrology, [type === 'rasi' ? 'rasiChartUrl' : 'navamsaChartUrl']: null });
            else if (type === 'gallery') { const currentGallery = [...(formData.gallery || [])]; if (index !== undefined && index < currentGallery.length) currentGallery.splice(index, 1); updateField('gallery', currentGallery); }
            return;
        }
        const activeUploadingType = type === 'gallery' ? `gallery_${index ?? (formData.gallery || []).length}` : type;
        setUploadingType(activeUploadingType);
        try {
            await deleteImageMutation.mutateAsync({ id: draftId, type, index });
            if (type === 'photo') updateField('profilePhoto', null);
            else if (type === 'rasi' || type === 'navamsa') updateField('astrology' as any, { ...formData.astrology, [type === 'rasi' ? 'rasiChartUrl' : 'navamsaChartUrl']: null });
            else if (type === 'gallery') { const currentGallery = [...(formData.gallery || [])]; if (index !== undefined && index < currentGallery.length) currentGallery.splice(index, 1); updateField('gallery', currentGallery); }
            toast.success(t('profile_new:toasts.delete_success') || 'Image deleted');
        } catch (error: any) { toast.error(error.message || 'Delete failed'); } finally { setUploadingType(null); }
    };

    const handleSaveDraft = async () => {
        setIsSubmitting(true);
        try {
            const payload = buildDraftPayload();
            const res = await saveDraftMutation.mutateAsync(payload);
            if (!draftId) {
                setDraftId(res.data.draftId);
                navigate(`?draftId=${res.data.draftId}`, { replace: true });
            }
            hasSavedOnceRef.current = true;
            setIsDirty(false);
            if (blocker.state === "blocked") blocker.proceed();
            else { toast.success(t('profile_new:toasts.draft_success')); isNavigatingRef.current = true; navigate('/manamaalai/my-profiles'); }
        } catch (error: any) { toast.error(error.message || t('profile_new:toasts.error')); }
        finally { setIsSubmitting(false); setShowDraftModal(false); }
    };

    const handleSubmit = async () => {
        const finalErrors = validateStep(8);
        if (finalErrors.length > 0) { toast.error(finalErrors[0]); return; }
        setIsSubmitting(true);
        try {
            let activeId = draftId;
            if (!activeId) {
                const draftPayload = buildDraftPayload();
                const draftRes = await saveDraftMutation.mutateAsync(draftPayload);
                activeId = draftRes.data.draftId;
                setDraftId(activeId);
                hasSavedOnceRef.current = true;
            }
            await publishMutation.mutateAsync(activeId);
            setIsDirty(false);
            reset();
            hasSavedOnceRef.current = false;
            toast.success(t('profile_new:toasts.success'));
            isNavigatingRef.current = true;
            navigate('/manamaalai/my-profiles');
        } catch (error: any) { toast.error(error.message || t('profile_new:toasts.error')); }
        finally { setIsSubmitting(false); }
    };

    const handleDiscard = async () => {
        setIsSubmitting(true);
        try {
            if (draftId) await cancelDraftMutation.mutateAsync(draftId);
            setIsDirty(false);
            hasSavedOnceRef.current = false;
            if (blocker.state === "blocked") blocker.proceed();
            else { isNavigatingRef.current = true; navigate(-1); }
        } catch {
            setIsDirty(false);
            if (blocker.state === "blocked") blocker.proceed();
            else { isNavigatingRef.current = true; navigate(-1); }
        } finally { setIsSubmitting(false); setShowDraftModal(false); }
    };

    return (
        <WizardLayout steps={steps} currentStep={currentStep} handleBack={handleBack} handleNext={handleNext} handleSubmit={handleSubmit} handleSaveDraft={handleSaveDraft} loading={isSubmitting} isStepValid={validateStep(currentStep).length === 0} title={t('common:create_profile')}>
            <UnsavedChangesModal isOpen={showDraftModal} onClose={() => { setShowDraftModal(false); if (blocker.state === "blocked") blocker.reset(); }} onSaveDraft={handleSaveDraft} onDiscard={handleDiscard} isSubmitting={isSubmitting} />
            <form onSubmit={(e: React.FormEvent) => e.preventDefault()} className="animate-in fade-in slide-in-from-right-4 duration-500">
                {currentStep === 1 && <Step2Personal formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 2 && <Step3Community formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 3 && <Step4Professional formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 4 && <Step5Family formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 5 && <Step6Assets formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 6 && <Step1Horoscope formData={formData} updateField={updateField} onAction={handleNext} onFileUpload={handleImageUpload} onFileDelete={handleImageDelete} isUploading={!!uploadingType} uploadingType={uploadingType} draftId={draftId} />}
                {currentStep === 7 && <Step7Gallery formData={formData} updateField={updateField} onAction={handleNext} onFileUpload={handleImageUpload} onFileDelete={handleImageDelete} isUploading={!!uploadingType} uploadingType={uploadingType} />}
                {currentStep === 8 && <Step8Review formData={formData} updateField={updateField} onAction={handleSubmit} />}
            </form>
        </WizardLayout>
    );
};

export { NewProfile as default, SouthIndianChart };
