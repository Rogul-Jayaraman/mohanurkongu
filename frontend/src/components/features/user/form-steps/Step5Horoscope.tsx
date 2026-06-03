import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useKeyboardFormNavigation } from '../../../../hooks/useKeyboardFormNavigation';
import { TimePicker, LocationAutocomplete, D1Chart, D9Chart, HoroscopeResults } from '../../../shared/horoscope';
import type { HoroscopeResult } from '@/types/horoscope';
import { SIGNS, NAKSHATRAS } from '@/types/horoscope';
import { NAKSHATRA_OPTIONS, RASI_OPTIONS } from '../../../../constants';
import { Spinner } from '../../../ui/feedback/Spinner';
import Select from '../../../ui/forms/Select';
import api from '@/lib/api';
import { getMaxDobDate, getMinDobDate } from '../../../../validation/profile-schema';
import { getImageUrl } from '../../../../utils/getImageUrl';
import type { StepProps } from './types';

// ───────────────────────────────────────────────────────────
// HoroscopeMethodSelector
// ───────────────────────────────────────────────────────────

const HoroscopeMethodSelector: React.FC<{ onSelect: (method: 'GENERATED' | 'UPLOADED') => void }> = ({ onSelect }) => {
    const { t } = useTranslation(['profile_new']);
    return (
        <motion.div key="choice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => onSelect('GENERATED')} className="group relative bg-ivory border border-gold/20 rounded-xl p-6 text-left transition-all hover:bg-ivory hover:border-rosewood/30 hover:shadow-lg hover:shadow-rosewood/5 overflow-hidden">
                <div className="flex items-start gap-5">
                    <div className="size-14 shrink-0 bg-rosewood-gradient text-white rounded-xl flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-3xl">auto_awesome</span></div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <h4 className="text-base font-black text-rosewood tracking-tight leading-tight">{t('profile_new:horoscope.auto_generate')}</h4>
                        <p className="text-sm text-rosewood/60 font-medium leading-relaxed">{t('profile_new:horoscope.auto_generate_sub')}</p>
                        <div className="pt-1 flex items-center gap-1.5 text-rosewood font-black text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity"><span className="leading-none">{t('profile_new:horoscope.select_mode')}</span><span className="material-symbols-outlined text-sm leading-none group-hover:translate-x-1 transition-transform">arrow_forward</span></div>
                    </div>
                </div>
            </button>
            <button onClick={() => onSelect('UPLOADED')} className="group relative bg-ivory border border-gold/20 rounded-xl p-6 text-left transition-all hover:bg-ivory hover:border-rosewood/30 hover:shadow-lg hover:shadow-rosewood/5 overflow-hidden">
                <div className="flex items-start gap-5">
                    <div className="size-14 shrink-0 bg-rosewood-gradient text-white rounded-xl flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-3xl">cloud_upload</span></div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <h4 className="text-base font-black text-rosewood tracking-tight leading-tight">{t('profile_new:horoscope.upload_chart')}</h4>
                        <p className="text-sm text-rosewood/60 font-medium leading-relaxed">{t('profile_new:horoscope.upload_chart_sub')}</p>
                        <div className="pt-1 flex items-center gap-1.5 text-rosewood font-black text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity"><span className="leading-none">{t('profile_new:horoscope.select_mode')}</span><span className="material-symbols-outlined text-sm leading-none group-hover:translate-x-1 transition-transform">arrow_forward</span></div>
                    </div>
                </div>
            </button>
        </motion.div>
    );
};

// ───────────────────────────────────────────────────────────
// HoroscopeAutoForm
// ───────────────────────────────────────────────────────────

const HoroscopeAutoForm: React.FC<{
    dob: string; onDobChange: (dob: string) => void; birthTime: string; onBirthTimeChange: (time: string) => void;
    birthPlaceName: string; onBirthPlaceChange: (data: { name: string; lat?: number; lon?: number }) => void;
    onGenerate: () => void; isGenerating: boolean;
}> = ({ dob, onDobChange, birthTime, onBirthTimeChange, birthPlaceName, onBirthPlaceChange, onGenerate, isGenerating }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const maxDobDate = getMaxDobDate();
    const minDobDate = getMinDobDate();
    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val && (val > maxDobDate || val < minDobDate)) { toast.error(t('profile_new:toasts.age_out_of_range')); return; }
        onDobChange(val);
    };
    return (
        <div className="space-y-6">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3">
                    <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">auto_awesome</span></div>
                    <h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:horoscope.auto_generate')}</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input className="hidden" type="date" value={dob ? dob.split('T')[0] : ''} onChange={handleDobChange} min={minDobDate} max={maxDobDate} />
                        <TimePicker value={birthTime} onChange={onBirthTimeChange} label={t('profile_new:horoscope.birth_time')} />
                    </div>
                    <LocationAutocomplete
                        value={birthPlaceName}
                        onChange={(val) => onBirthPlaceChange({ name: val })}
                        onSelect={(loc) => onBirthPlaceChange({ name: loc.displayName, lat: loc.latitude, lon: loc.longitude })}
                        label={t('profile_new:horoscope.birth_place')}
                    />
                    <div className="flex justify-center pt-2">
                        <button type="button" onClick={onGenerate} disabled={isGenerating || !birthTime || !birthPlaceName || !dob}
                            className="flex items-center justify-center gap-2.5 px-8 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-sm hover:bg-rosewood-dark transition-all disabled:opacity-50 active:scale-[0.98]">
                            {isGenerating ? <Spinner size="sm" color="white" /> : <span className="material-symbols-outlined text-base">auto_awesome</span>}
                            <span>{isGenerating ? t('profile_new:horoscope.generating') : t('profile_new:horoscope.generate_now')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────
// HoroscopeUploadForm
// ───────────────────────────────────────────────────────────

const HoroscopeUploadForm: React.FC<{
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'rasi' | 'navamsa' | 'full') => void;
    onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>;
    rasiChartUploadId?: string | null; rasiChartUploadUrl?: string | null; navamsaChartUploadId?: string | null; navamsaChartUploadUrl?: string | null;
    isUploading?: boolean; uploadingType?: string | null;
    formData: any; updateField: (field: string, val: any) => void;
    fieldErrors?: Record<string, string>;
    touchedFields?: Set<string>; markTouched?: (field: string) => void;
}> = ({ onFileUpload, onFileDelete, rasiChartUploadId, rasiChartUploadUrl, navamsaChartUploadId, navamsaChartUploadUrl, isUploading = false, uploadingType, formData, updateField, fieldErrors = {}, touchedFields = new Set(), markTouched = () => {} }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const rasiRef = React.useRef<HTMLInputElement>(null);
    const navamsaRef = React.useRef<HTMLInputElement>(null);
    const [previewUploadId, setPreviewUploadId] = React.useState<string | null>(null);
    const [previewUploadUrl, setPreviewUploadUrl] = React.useState<string | null>(null);

    const renderUploadSlot = (type: 'rasi' | 'navamsa', labelKey: string, chartUploadId?: string | null, chartUploadUrl?: string | null) => {
        const isSlotUploading = isUploading && uploadingType === type;
        return (
            <motion.div layout className="flex flex-col items-center gap-3">
                <div className="text-center">
                    <h4 className="text-sm font-black text-rosewood tracking-wider">{t(`profile_new:horoscope.${labelKey}`)}</h4>
                    {!chartUploadId && (<p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">JPG / PNG · Max 5MB</p>)}
                </div>
                <div className={`relative rounded-2xl transition-all duration-500 overflow-hidden ${chartUploadId ? 'ring-2 ring-gold/30 shadow-xl shadow-rosewood/10 p-1.5 bg-white' : 'border-2 border-dashed border-gold-soft/40 bg-ivory/50 hover:bg-ivory hover:border-gold/60'}`}>
                    <div className="relative overflow-hidden rounded-xl size-44 sm:size-52">
                        {chartUploadId ? (
                            <img src={getImageUrl(chartUploadUrl) || ''} alt={type} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6">
                                <div className="size-16 rounded-2xl bg-rosewood/5 flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-rosewood/40">cloud_upload</span></div>
                                <p className="text-[10px] font-black text-rosewood/30 uppercase tracking-widest text-center leading-relaxed">{t(`profile_new:horoscope.upload_${type}`)}</p>
                            </div>
                        )}
                        {isSlotUploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-30">
                                <div className="size-12 rounded-full border-2 border-rosewood/20 border-t-rosewood animate-spin mb-2" />
                                <p className="text-[8px] animate-pulse text-rosewood font-black tracking-widest uppercase">{t('profile_new:processing')}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!chartUploadId && !isSlotUploading && (
                        <label className="flex items-center gap-1.5 px-4 py-2 bg-rosewood text-white rounded-xl text-[10px] font-black hover:bg-rosewood/90 hover:shadow-md transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-sm">cloud_upload</span>
                            <span>{t('profile_new:horoscope.upload_chart')}</span>
                            <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileUpload(e, type); }} />
                        </label>
                    )}
                    {chartUploadId && !isSlotUploading && (
                        <div className="flex items-center gap-1">
                            <label className="size-9 rounded-xl bg-ivory border border-gold-soft/30 flex items-center justify-center text-rosewood/60 hover:text-rosewood hover:border-rosewood/40 hover:bg-white hover:shadow-sm transition-all cursor-pointer" title="Change">
                                <span className="material-symbols-outlined text-lg">edit</span>
                                <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileUpload(e, type); }} />
                            </label>
                            <button onClick={() => onFileDelete(type)} className="size-9 rounded-xl bg-ivory border border-gold-soft/30 flex items-center justify-center text-rosewood/60 hover:text-red-500 hover:border-red-300 hover:bg-red-50 hover:shadow-sm transition-all" title="Remove"><span className="material-symbols-outlined text-lg">delete</span></button>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">wb_sunny</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.astrology')}</h3></div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Select label={t('profile_new:star')} value={formData.star || ''} onChange={(val) => updateField('star', val)} options={NAKSHATRA_OPTIONS} bilingual error={touchedFields.has('star') ? fieldErrors?.star : undefined} onBlur={() => markTouched('star')} required />
                    <Select label={t('profile_new:rasi')} value={formData.rasi || ''} onChange={(val) => updateField('rasi', val)} options={RASI_OPTIONS} bilingual error={touchedFields.has('rasi') ? fieldErrors?.rasi : undefined} onBlur={() => markTouched('rasi')} required />
                    <Select label={t('profile_new:laganam')} value={formData.laganam || ''} onChange={(val) => updateField('laganam', val)} options={RASI_OPTIONS} bilingual error={touchedFields.has('laganam') ? fieldErrors?.laganam : undefined} onBlur={() => markTouched('laganam')} required />
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center"><span className="material-symbols-outlined text-base!">auto_awesome</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:horoscope.upload_your_charts')}</h3></div>
                <div className="p-8 flex flex-col items-center">
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex flex-wrap justify-center gap-8">
                            {renderUploadSlot('rasi', 'rasi_chart_label', rasiChartUploadId, rasiChartUploadUrl)}
                            {renderUploadSlot('navamsa', 'navamsa_chart_label', navamsaChartUploadId, navamsaChartUploadUrl)}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step5Horoscope
// ═══════════════════════════════════════════════════════════

interface Step5Props extends StepProps {
    isUploading?: boolean;
    uploadingType?: string | null;
    onFileUpload: (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>;
    onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>;
}

const Step5Horoscope: React.FC<Step5Props> = ({ formData, updateField, onAction, isUploading: parentIsUploading, uploadingType, onFileUpload, onFileDelete, fieldErrors = {}, touchedFields = new Set(), markTouched = () => {} }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    const [activeMethod, setActiveMethod] = useState<'GENERATED' | 'UPLOADED' | 'none'>(() => formData.astrology?.mode || 'none');
    const [isGenerating, setIsGenerating] = useState(false);
    const isUploading = parentIsUploading || false;
    const hJson = formData.astrology?.horoscopeJson;
    const [birthTime, setBirthTime] = useState(hJson?.input?.timeOfBirth || '');
    const [birthPlace, setBirthPlace] = useState<{ name: string; lat?: number; lon?: number }>({ name: hJson?.input?.location?.displayName || '', lat: hJson?.input?.location?.latitude, lon: hJson?.input?.location?.longitude });
    const [generatedResult, setGeneratedResult] = useState<HoroscopeResult | null>(() => {
        if (formData.astrology?.mode === 'GENERATED' && formData.astrology?.horoscopeJson) {
            const parsed = typeof formData.astrology.horoscopeJson === 'string' ? JSON.parse(formData.astrology.horoscopeJson) : formData.astrology.horoscopeJson;
            return parsed as HoroscopeResult;
        }
        return null;
    });

    const handleMethodSelect = (method: 'GENERATED' | 'UPLOADED') => { setActiveMethod(method); updateField('astrology', { ...formData.astrology, mode: method }); };
    const handleResetMethod = () => { setActiveMethod('none'); setGeneratedResult(null); updateField('astrology', { ...formData.astrology, mode: 'none' }); };

    const mapRasiToFormValue = (rasiIndex: number): string => {
        const rasiSign = SIGNS[rasiIndex];
        const rasiMap: Record<string, string> = { 'Aries': 'MESHA', 'Taurus': 'VRISHABHA', 'Gemini': 'MITHUNA', 'Cancer': 'KATAKA', 'Leo': 'SIMHA', 'Virgo': 'KANYA', 'Libra': 'TULA', 'Scorpio': 'VRISCHIKA', 'Sagittarius': 'DHANUS', 'Capricorn': 'MAKARA', 'Aquarius': 'KUMBHA', 'Pisces': 'MEENA' };
        return rasiMap[rasiSign] || '';
    };

    const mapNakshatraToFormValue = (nakshatraIndex: number): string => {
        const nakshatra = NAKSHATRAS[nakshatraIndex];
        const nakshatraMap: Record<string, string> = { 'Ashwini': 'ASHWINI', 'Bharani': 'BHARANI', 'Krittika': 'KRITTIKA', 'Rohini': 'ROHINI', 'Mrigashirsha': 'MRIGASHIRA', 'Ardra': 'ARDRA', 'Punarvasu': 'PUNARVASU', 'Pushya': 'PUSHYA', 'Ashlesha': 'ASHLESHA', 'Magha': 'MAGHA', 'Purva Phalguni': 'PURVA_PHALGUNI', 'Uttara Phalguni': 'UTTARA_PHALGUNI', 'Hasta': 'HASTA', 'Chitra': 'CHITRA', 'Swati': 'SWATI', 'Vishakha': 'VISHAKHA', 'Anuradha': 'ANURADHA', 'Jyeshtha': 'JYESHTHA', 'Mula': 'MULA', 'Purva Ashadha': 'PURVA_ASHADHA', 'Uttara Ashadha': 'UTTARA_ASHADHA', 'Shravana': 'SHRAVANA', 'Dhanistha': 'DHANISHTHA', 'Shatabhisha': 'SHATABHISHA', 'Purva Bhadrapada': 'PURVA_BHADRAPADA', 'Uttara Bhadrapada': 'UTTARA_BHADRAPADA', 'Revati': 'REVATI' };
        return nakshatraMap[nakshatra] || '';
    };

    const handleGenerate = async () => {
        if (!formData.dob || !birthTime || !birthPlace.name || birthPlace.lat === undefined || birthPlace.lon === undefined) {
            toast.error(t('profile_new:toasts.error_missing_birth_details'));
            return;
        }
        setIsGenerating(true);
        try {
            const result = await api.post('/horoscope/generate', {
                dateOfBirth: formData.dob?.split('T')[0] ?? formData.dob,
                timeOfBirth: birthTime,
                location: { displayName: birthPlace.name, latitude: birthPlace.lat, longitude: birthPlace.lon },
            }) as unknown as HoroscopeResult;

            result.input.dateOfBirth = formData.dob?.split('T')[0] ?? formData.dob;
            const starValue = mapNakshatraToFormValue(result.summary.nakshatraIndex);
            const rasiValue = mapRasiToFormValue(result.summary.rasiSignIndex);
            const laganamValue = mapRasiToFormValue(result.summary.lagnaSignIndex);

            updateField('astrology', { ...formData.astrology, mode: 'GENERATED', horoscopeJson: result, generatedAt: new Date().toISOString(), star: starValue, rasi: rasiValue, laganam: laganamValue });
            updateField('star', starValue);
            updateField('rasi', rasiValue);
            updateField('laganam', laganamValue);
            setGeneratedResult(result);
            toast.success(t('profile_new:toasts.horoscope_generated'));
        } catch { toast.error(t('profile_new:toasts.error_generating_horoscope')); } finally { setIsGenerating(false); }
    };

    const handleRegenerate = () => {
        setGeneratedResult(null);
        updateField('astrology', { ...formData.astrology, horoscopeJson: null });
        updateField('star', null);
        updateField('rasi', null);
        updateField('laganam', null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'rasi' | 'navamsa' | 'full') => {
        const file = e.target.files?.[0];
        if (!file) return;
        try { if (target === 'full') { await onFileUpload(file, 'rasi'); } else { await onFileUpload(file, target); } } catch {}
    };

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AnimatePresence mode="wait">
                {activeMethod === 'none' ? (<HoroscopeMethodSelector onSelect={handleMethodSelect} />) : (
                    <motion.div key="active" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="space-y-8">
                        {activeMethod === 'GENERATED' && generatedResult ? null : (
                            <button type="button" onClick={handleResetMethod} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/70 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all"><span className="material-symbols-outlined text-sm font-black">arrow_back</span><span className="text-[10px] font-black tracking-widest uppercase">{t('common:back')}</span></button>
                        )}
                        <div>
                            {activeMethod === 'GENERATED' ? (
                                generatedResult ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-end gap-4 flex-wrap">
                                            <button type="button" onClick={onAction} className="flex items-center justify-center gap-2 px-6 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-sm hover:bg-rosewood-dark transition-all active:scale-[0.98]"><span>{t('common:next')}</span><span className="material-symbols-outlined text-base">arrow_forward</span></button>
                                        </div>
                                        <HoroscopeResults result={generatedResult} loading={false} error={null} onRegenerate={handleRegenerate} />
                                    </div>
                                ) : (<HoroscopeAutoForm dob={formData.dob} onDobChange={(val) => updateField('dob', val)} birthTime={birthTime} onBirthTimeChange={setBirthTime} birthPlaceName={birthPlace.name} onBirthPlaceChange={setBirthPlace} onGenerate={handleGenerate} isGenerating={isGenerating} />)
                            ) : (
                                <HoroscopeUploadForm onFileUpload={handleFileUpload} onFileDelete={onFileDelete} rasiChartUploadId={formData.astrology?.rasiChartUploadId || null} rasiChartUploadUrl={formData.astrology?.rasiChartUploadUrl || null} navamsaChartUploadId={formData.astrology?.navamsaChartUploadId || null} navamsaChartUploadUrl={formData.astrology?.navamsaChartUploadUrl || null} isUploading={isUploading} uploadingType={uploadingType} formData={formData} updateField={updateField} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Step5Horoscope;
