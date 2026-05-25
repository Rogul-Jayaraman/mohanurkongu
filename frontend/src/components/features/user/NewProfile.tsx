import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useScrollToTop } from '../../ui/layout/ScrollToTop';
import { useProfileForm } from '../../../hooks/useProfileForm';
import { TimePicker, LocationAutocomplete, D1Chart, D9Chart, HoroscopeResults } from '../../../components/shared/horoscope';
import type { HoroscopeResult, PlanetData } from '@/types/horoscope';
import { SIGNS, NAKSHATRAS } from '@/types/horoscope';
import { getBilingualLabel } from '../../../utils/bilingual';
import { useKeyboardFormNavigation } from '../../../hooks/useKeyboardFormNavigation';
import { useLanguage } from '../../../context/LanguageContext';
import { Spinner } from '../../ui/feedback/Spinner';
import TranslatableInput from '../../ui/forms/TranslatableInput';
import TranslatableTextarea from '../../ui/forms/TranslatableTextarea';
import { Input } from '../../ui/forms/Input';
import Select from '../../ui/forms/Select';
import Toggle from '../../ui/forms/FormToggle';
import RangeSlider from '../../ui/forms/RangeSlider';
import api from '@/lib/api';
import { MediaImage } from '../../ui/media/MediaImage';
import { uploadFile, deleteUpload, saveDraft, resumeDraft, createProfile, publishProfile } from '../../../api/profile.api';
import { formToDraft, draftToForm } from '../../../adapters/profile.adapter';
import { getErrorMessage } from '../../../lib/errors';

import {
    PROFILE_FOR_OPTIONS, GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, DIET_OPTIONS,
    COMPLEXION_OPTIONS, BLOOD_GROUP_OPTIONS, HEIGHT_OPTIONS, JOB_SECTOR_OPTIONS,
    RESIDENCE_OPTIONS, RASI_OPTIONS, NAKSHATRA_OPTIONS, KULAM_OPTIONS
} from '../../../constants';
import { DISTRICTS, TALUKS_BY_DISTRICT, DISTRICT_TAMIL, TALUK_TAMIL } from '../../../constants/locations';

// ═══════════════════════════════════════════════════════════
// NewProfile (Main Page)
// ═══════════════════════════════════════════════════════════

const NewProfile: React.FC = () => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const navigate = useNavigate();
    const { setHeaderContent } = useOutletContext<{ setHeaderContent: (content: React.ReactNode) => void }>();
    const { formData, updateField, isDirty, setIsDirty, setFormData, persistDraft } = useProfileForm();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [draftProfileId, setDraftProfileId] = useState<string | null>(null);
    const totalSteps = 7;
    const toLocalDateStr = (d: Date) => { const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().split('T')[0]; };
    const maxDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 21); return toLocalDateStr(d); })();
    const minDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 40); return toLocalDateStr(d); })();

    useScrollToTop([currentStep]);

    const steps = [
        { title: t('common:setup.step1.title'), icon: 'person' },
        { title: t('common:setup.step2.title'), icon: 'school' },
        { title: t('common:setup.step3.title'), icon: 'family_restroom' },
        { title: t('common:setup.step4.title'), icon: 'account_balance' },
        { title: t('common:setup.step5.title'), icon: 'auto_awesome' },
        { title: t('common:setup.step6.title'), icon: 'photo_library' },
        { title: t('common:setup.step7.title'), icon: 'verified' },
    ];

    useEffect(() => {
        setHeaderContent(
            <div className="flex flex-col gap-0.5 min-w-[200px]">
                <h2 className="text-sm md:text-base font-serif font-bold text-rosewood leading-tight truncate">
                    {t('common:nav.new_profile')}
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-rosewood/60 whitespace-nowrap">
                        {t('common:setup.stepProgress', { current: currentStep, total: totalSteps })}
                    </span>
                    <div className="flex-1 h-0.5 bg-gold-soft/30 rounded-full overflow-hidden max-w-[120px]">
                        <div className="h-full bg-rosewood rounded-full transition-all duration-700"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
                    </div>
                </div>
            </div>
        );
        return () => setHeaderContent(null);
    }, [currentStep, setHeaderContent]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const draftId = params.get('draft');
        if (draftId) {
            const loadDraft = async () => {
                try {
                    const draft = await resumeDraft(draftId);
                    const restored = draftToForm(draft as any);
                    setFormData(prev => ({ ...{ profileFor: 'MYSELF', gender: 'MALE', maritalStatus: 'NEVER_MARRIED', diet: 'VEGETARIAN', caste: 'BC', community: 'Kongu Vellalar', noOfBrothers: 0, noOfSisters: 0, fatherIsLate: false, motherIsLate: false, status: 'ACTIVE' as any, astrology: { mode: 'none' } }, ...restored }));
                    setIsDirty(false);
                    const { indexedDBStorage } = await import('../../../lib/indexeddb');
                    await indexedDBStorage.saveDraft(draft as any);
                    setDraftProfileId(draftId);
                } catch { toast.error('Failed to load draft'); }
            };
            loadDraft();
        }
    }, [setFormData, setIsDirty]);

    useEffect(() => {
        if (isDirty) {
            persistDraft();
        }
    }, [currentStep, isDirty, persistDraft]);

    const isEn = i18n.language === 'en';

    const validateStep = (step: number) => {
        const errors: string[] = [];
        if (step === 1) {
            if (formData.dob && (formData.dob > maxDobDate || formData.dob < minDobDate)) errors.push(t('profile_new:toasts.age_out_of_range'));
        }
        return errors;
    };

    const handleNext = () => {
        const stepErrors = validateStep(currentStep);
        if (stepErrors.length > 0) { toast.error(stepErrors[0]); return; }
        if (currentStep < totalSteps) {
            setCurrentStep((prev: number) => prev + 1);
        }
    };

    const handleBack = () => { if (currentStep > 1) setCurrentStep((prev: number) => prev - 1); else navigate(-1); };

    const compressImage = async (file: File, maxBytes = 3 * 1024 * 1024): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                let { width, height } = img;
                const MAX_DIM = 1800;
                if (width > MAX_DIM || height > MAX_DIM) {
                    const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
                ctx.drawImage(img, 0, 0, width, height);
                const tryQuality = (quality: number) => {
                    canvas.toBlob((blob) => {
                        if (!blob) { reject(new Error('Image compression failed')); return; }
                        if (blob.size <= maxBytes || quality <= 0.1) {
                            resolve(blob);
                        } else {
                            tryQuality(Math.max(0.1, quality - 0.1));
                        }
                    }, 'image/webp', quality);
                };
                tryQuality(0.85);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image for compression')); };
            img.src = url;
        });
    };

    const handleImageUpload = async (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => {
        const activeType = type === 'gallery' ? `gallery_${index ?? 0}` : type;
        setUploadingType(activeType);
        try {
            const compressed = await compressImage(file);
            const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
            const fd = new FormData();
            fd.append('file', compressedFile);
            const category = type === 'photo' ? 'profiles' : type === 'gallery' ? 'gallery' : 'horoscope';
            fd.append('category', category);
            const result = await uploadFile(fd);
            if (type === 'photo') {
                updateField('primaryUploadId', result.uploadId);
            } else if (type === 'rasi' || type === 'navamsa') {
                const key = type === 'rasi' ? 'rasiChartUploadId' : 'navamsaChartUploadId';
                updateField('astrology' as any, { ...formData.astrology, [key]: result.uploadId });
            } else {
                const currentIds = [...(formData.galleryUploadIds || [])];
                if (index !== undefined && index < currentIds.length) {
                    currentIds[index] = result.uploadId;
                } else {
                    currentIds.push(result.uploadId);
                }
                updateField('galleryUploadIds' as any, currentIds);
            }
            toast.success(t('profile_new:toasts.upload_success'));
        } catch (err) { toast.error(getErrorMessage(err, t('profile_new:toasts.upload_error'))); } finally { setUploadingType(null); }
    };

    const handleImageDelete = async (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => {
        try {
            if (type === 'photo') {
                const id = (formData as any).primaryUploadId;
                if (id) await deleteUpload(id);
                updateField('primaryUploadId', null);
            } else if (type === 'rasi' || type === 'navamsa') {
                const key = type === 'rasi' ? 'rasiChartUploadId' : 'navamsaChartUploadId';
                const id = (formData as any).astrology?.[key];
                if (id) await deleteUpload(id);
                updateField('astrology' as any, { ...(formData as any).astrology, [key]: null });
            } else if (type === 'gallery' && index !== undefined) {
                const ids = [...((formData as any).galleryUploadIds || [])];
                const id = ids[index];
                if (id) await deleteUpload(id);
                ids.splice(index, 1);
                updateField('galleryUploadIds' as any, ids);
            }
            toast.success(t('profile_new:toasts.delete_success'));
        } catch { toast.error(t('profile_new:toasts.delete_error')); }
    };

    const handleSaveDraft = async () => {
        try {
            setIsSubmitting(true);
            const draft = formToDraft(formData);
            const result = await saveDraft(draft as any);
            await persistDraft();
            toast.success(t('profile_new:toasts.draft_success'));
            navigate('/manamaalai/my-profiles');
        } catch { toast.error(t('profile_new:toasts.draft_error')); }
        finally { setIsSubmitting(false); }
    };

    const handleSubmit = async () => {
        const requiredErrors: string[] = [];
        if (!formData.firstNameEn?.trim()) requiredErrors.push('First name is required');
        if (!formData.gender) requiredErrors.push('Gender is required');
        if (!formData.agreedToTerms) requiredErrors.push('You must agree to the terms');
        if (requiredErrors.length > 0) { toast.error(requiredErrors[0]); return; }

        try {
            setIsSubmitting(true);
            const { indexedDBStorage } = await import('../../../lib/indexeddb');
            if (draftProfileId) {
                const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
                await publishProfile(draftProfileId, idempotencyKey, formData.agreedToTerms || false);
            } else {
                const draft = formToDraft(formData);
                await createProfile({ ...draft, agreedToTerms: formData.agreedToTerms || false });
            }
            await indexedDBStorage.clearDraft();
            toast.success(t('profile_new:toasts.success'));
            navigate('/manamaalai/my-profiles');
        } catch { toast.error(t('profile_new:toasts.publish_error')); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="max-w-4xl mx-auto w-full pt-10 lg:pt-16 pb-8 lg:pb-12 px-2 sm:px-4 min-h-full flex flex-col">
            <form onSubmit={(e: React.FormEvent) => e.preventDefault()} className="flex-1">
                {currentStep === 1 && <Step1Personal formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 2 && <Step2Combined formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 3 && <Step3Family formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 4 && <Step4Assets formData={formData} updateField={updateField} onAction={handleNext} />}
                {currentStep === 5 && <Step5Horoscope formData={formData} updateField={updateField} onAction={handleNext} onFileUpload={handleImageUpload} onFileDelete={handleImageDelete} isUploading={!!uploadingType} uploadingType={uploadingType} />}
                {currentStep === 6 && <Step6Gallery formData={formData} updateField={updateField} onAction={handleNext} onFileUpload={handleImageUpload} onFileDelete={handleImageDelete} isUploading={!!uploadingType} uploadingType={uploadingType} />}
                {currentStep === 7 && <Step7Review formData={formData} updateField={updateField} onAction={handleSubmit} />}
            </form>

            <div className="mt-auto pt-6 border-t border-gold-soft/10">
                <div className="flex flex-row items-center justify-between gap-3">
                    <button onClick={handleBack} disabled={currentStep === 1}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/70 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="hidden sm:inline">{t('common:setup.back')}</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={handleSaveDraft}
                            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/50 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all">
                            <span className="material-symbols-outlined text-sm">save</span>
                            <span className="hidden sm:inline">{t('common:save_as_draft')}</span>
                        </button>
                        {currentStep === totalSteps ? (
                            <button onClick={handleSubmit}
                                className="flex items-center justify-center gap-1.5 px-6 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-xs hover:bg-rosewood-dark transition-all active:scale-[0.98]">
                                {isSubmitting ? <Spinner size="sm" color="white" /> : (
                                    <><span className="hidden sm:inline">{t('common:setup.create')}</span><span className="material-symbols-outlined text-base">check</span></>
                                )}
                            </button>
                        ) : (
                            <button onClick={handleNext}
                                className="flex items-center justify-center gap-1.5 px-6 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-xs hover:bg-rosewood-dark transition-all active:scale-[0.98]">
                                <span className="hidden sm:inline">{t('common:setup.next')}</span>
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        )}
                    </div>
                </div>
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
            <button onClick={() => onSelect('CREATE')} className="group relative bg-ivory border border-gold/20 rounded-xl p-6 text-left transition-all hover:bg-ivory hover:border-rosewood/30 hover:shadow-lg hover:shadow-rosewood/5 overflow-hidden">
                <div className="flex items-start gap-5">
                    <div className="size-14 shrink-0 bg-rosewood-gradient text-white rounded-xl flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-3xl">auto_awesome</span></div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <h4 className="text-base font-black text-rosewood tracking-tight leading-tight">{t('profile_new:horoscope.auto_generate')}</h4>
                        <p className="text-sm text-rosewood/60 font-medium leading-relaxed">{t('profile_new:horoscope.auto_generate_sub')}</p>
                        <div className="pt-1 flex items-center gap-1.5 text-rosewood font-black text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity"><span className="leading-none">{t('profile_new:horoscope.select_mode')}</span><span className="material-symbols-outlined text-sm leading-none group-hover:translate-x-1 transition-transform">arrow_forward</span></div>
                    </div>
                </div>
            </button>
            <button onClick={() => onSelect('UPLOAD')} className="group relative bg-ivory border border-gold/20 rounded-xl p-6 text-left transition-all hover:bg-ivory hover:border-rosewood/30 hover:shadow-lg hover:shadow-rosewood/5 overflow-hidden">
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

// ═══════════════════════════════════════════════════════════
// HoroscopeAutoForm
// ═══════════════════════════════════════════════════════════

const HoroscopeAutoForm: React.FC<{
    dob: string; onDobChange: (dob: string) => void; birthTime: string; onBirthTimeChange: (time: string) => void;
    birthPlaceName: string; onBirthPlaceChange: (data: { name: string; lat?: number; lon?: number }) => void;
    onGenerate: () => void; isGenerating: boolean;
}> = ({ dob, onDobChange, birthTime, onBirthTimeChange, birthPlaceName, onBirthPlaceChange, onGenerate, isGenerating }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const toLocalDateStr = (d: Date) => { const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().split('T')[0]; };
    const maxDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 21); return toLocalDateStr(d); })();
    const minDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 40); return toLocalDateStr(d); })();
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
                        <Input label={t('profile_new:dob')} icon="event" name="dob" type="date" value={dob ? dob.split('T')[0] : ''} onChange={handleDobChange} min={minDobDate} max={maxDobDate} />
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

// ═══════════════════════════════════════════════════════════
// HoroscopeUploadForm
// ═══════════════════════════════════════════════════════════

const HoroscopeUploadForm: React.FC<{
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'rasi' | 'navamsa' | 'full') => void;
    onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>;
    rasiChartUploadId?: string | null; navamsaChartUploadId?: string | null;
    isUploading?: boolean; uploadingType?: string | null;
    formData: any; updateField: (field: string, val: any) => void;
}> = ({ onFileUpload, onFileDelete, rasiChartUploadId, navamsaChartUploadId, isUploading = false, uploadingType, formData, updateField }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const rasiRef = React.useRef<HTMLInputElement>(null);
    const navamsaRef = React.useRef<HTMLInputElement>(null);
    const inputRefs = { rasi: rasiRef, navamsa: navamsaRef };
    const [previewUploadId, setPreviewUploadId] = React.useState<string | null>(null);

    const renderUploadSlot = (type: 'rasi' | 'navamsa', labelKey: string, chartUploadId?: string | null) => {
        const isSlotUploading = isUploading && uploadingType === type;
        return (
            <motion.div layout className="flex flex-col items-center gap-3">
                <div className="text-center">
                    <h4 className="text-sm font-black text-rosewood tracking-wider">{t(`profile_new:horoscope.${labelKey}`)}</h4>
                    {!chartUploadId && (
                        <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">JPG / PNG · Max 5MB</p>
                    )}
                </div>
                <div className={`relative rounded-2xl transition-all duration-500 overflow-hidden
                    ${chartUploadId
                        ? 'ring-2 ring-gold/30 shadow-xl shadow-rosewood/10 p-1.5 bg-white'
                        : 'border-2 border-dashed border-gold-soft/40 bg-ivory/50 hover:bg-ivory hover:border-gold/60'}`}>
                    <div className={`relative overflow-hidden rounded-xl size-44 sm:size-52`}>
                        {chartUploadId ? (
                            <MediaImage uploadId={chartUploadId} alt={type}
                                className="w-full h-full object-contain transition-transform duration-700 cursor-pointer"
                                fallback={<div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">Error</div>}
                                onClick={() => chartUploadId && setPreviewUploadId(chartUploadId)} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6">
                                <div className="size-16 rounded-2xl bg-rosewood/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-rosewood/40">cloud_upload</span>
                                </div>
                                <p className="text-[10px] font-black text-rosewood/30 uppercase tracking-widest text-center leading-relaxed">
                                    {t(`profile_new:horoscope.upload_${type}`)}
                                </p>
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
                            <input type="file" className="hidden" accept="image/*" disabled={isUploading}
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileUpload(e as any, type); }} />
                        </label>
                    )}
                    {chartUploadId && !isSlotUploading && (
                        <div className="flex items-center gap-1">
                            <label className="size-9 rounded-xl bg-ivory border border-gold-soft/30 flex items-center justify-center text-rosewood/60 hover:text-rosewood hover:border-rosewood/40 hover:bg-white hover:shadow-sm transition-all cursor-pointer" title="Change">
                                <span className="material-symbols-outlined text-lg">edit</span>
                                <input type="file" className="hidden" accept="image/*" disabled={isUploading}
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileUpload(e as any, type); }} />
                            </label>
                            <button onClick={() => onFileDelete(type)}
                                className="size-9 rounded-xl bg-ivory border border-gold-soft/30 flex items-center justify-center text-rosewood/60 hover:text-red-500 hover:border-red-300 hover:bg-red-50 hover:shadow-sm transition-all" title="Remove">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
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
                    <Select label={t('profile_new:star')} value={formData.star || ''} onChange={(val) => updateField('star', val)} options={NAKSHATRA_OPTIONS} bilingual />
                    <Select label={t('profile_new:rasi')} value={formData.rasi || ''} onChange={(val) => updateField('rasi', val)} options={RASI_OPTIONS} bilingual />
                    <Select label={t('profile_new:laganam')} value={formData.laganam || ''} onChange={(val) => updateField('laganam', val)} options={RASI_OPTIONS} bilingual />
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center"><span className="material-symbols-outlined text-base!">auto_awesome</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:horoscope.upload_your_charts')}</h3></div>
                <div className="p-8 flex flex-col items-center">
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex flex-wrap justify-center gap-8">
                            {renderUploadSlot('rasi', 'rasi_chart_label', rasiChartUploadId)}
                            {renderUploadSlot('navamsa', 'navamsa_chart_label', navamsaChartUploadId)}
                        </div>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {previewUploadId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setPreviewUploadId(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}>
                            <MediaImage uploadId={previewUploadId} alt="Preview" className="w-full h-full object-contain max-h-[85vh]" />
                            <button onClick={() => setPreviewUploadId(null)}
                                className="absolute top-3 right-3 size-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};



// ═══════════════════════════════════════════════════════════
// Step1Personal
// ═══════════════════════════════════════════════════════════

interface StepProps { formData: any; updateField: (field: any, value: any) => void; onAction?: () => void; }

const Step1Personal: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const toLocalDateStr = (d: Date) => { const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().split('T')[0]; };
    const maxDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 21); return toLocalDateStr(d); })();
    const minDobDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 40); return toLocalDateStr(d); })();
    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val && (val > maxDobDate || val < minDobDate)) { toast.error(t('profile_new:toasts.age_out_of_range')); return; }
        updateField('dob', val);
    };
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    const districtToStringOptions = (arr: string[]) => arr.map(s => { const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); return { value: s, label: { en: formattedEn, ta: DISTRICT_TAMIL[s] || formattedEn } }; });
    const talukToStringOptions = (arr: string[]) => arr.map(s => { const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); return { value: s, label: { en: formattedEn, ta: TALUK_TAMIL[s] || formattedEn } }; });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">groups</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.connection')}</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <TranslatableInput label={t('profile_new:first_name')} valueEn={formData.firstNameEn || ''} valueTa={formData.firstNameTa || ''} onChangeEn={(val) => updateField('firstNameEn', val)} onChangeTa={(val) => updateField('firstNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.first_name')} />
                        <TranslatableInput label={t('profile_new:last_name')} valueEn={formData.lastNameEn || ''} valueTa={formData.lastNameTa || ''} onChangeEn={(val) => updateField('lastNameEn', val)} onChangeTa={(val) => updateField('lastNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.last_name')} />
                    </div>
                    <Toggle label={t('profile_new:gender')} value={formData.gender || ''} onChange={(val) => updateField('gender', val)} options={GENDER_OPTIONS} name="gender" />
                    <Input label={t('profile_new:dob')} icon="event" name="dob" type="date" value={formData.dob?.split('T')[0] || ''} onChange={handleDobChange} min={minDobDate} max={maxDobDate} />
                    <Select label={t('profile_new:profile_for')} value={formData.profileFor || ''} onChange={(val) => updateField('profileFor', val)} options={PROFILE_FOR_OPTIONS} />
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">accessibility_new</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.body_lifestyle')}</h3></div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"><Select label={t('profile_new:marital_status')} value={formData.maritalStatus || ''} onChange={(val) => updateField('maritalStatus', val)} options={MARITAL_STATUS_OPTIONS} /><Toggle label={t('profile_new:diet')} value={formData.diet || ''} onChange={(val) => updateField('diet', val)} options={DIET_OPTIONS} name="diet" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t border-gold-soft/5">
                        <Select label={t('profile_new:blood_group')} value={formData.bloodGroup || ''} onChange={(val) => updateField('bloodGroup', val)} options={BLOOD_GROUP_OPTIONS} />
                        <Select label={t('profile_new:height')} value={formData.height?.toString() || ''} onChange={(val) => updateField('height', parseInt(val))} options={HEIGHT_OPTIONS} />
                        <Input label={t('profile_new:weight')} name="weight" value={formData.weight?.toString() || ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = parseInt(val); if (val !== '' && numVal > 250) return; updateField('weight', val === '' ? undefined : numVal); }} icon="monitor_weight" placeholder={t('profile_new:placeholders.weight')} inputMode="numeric"><span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[10px] text-slate-300 group-hover/input:text-rosewood transition-colors">KG</span></Input>
                        <Select label={t('profile_new:complexion')} value={formData.complexion || 'NOT_SPECIFIED'} onChange={(val) => updateField('complexion', val)} options={COMPLEXION_OPTIONS} />
                    </div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">location_on</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.locations')}</h3></div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select label={t('profile_new:current_district')} value={formData.currentDistrict || ''} onChange={(val) => { updateField('currentDistrict', val); if (val !== 'OTHER') { updateField('currentDistrictEn', val); updateField('currentDistrictTa', DISTRICT_TAMIL[val] || val); updateField('currentStateEn', 'Tamil Nadu'); updateField('currentStateTa', 'தமிழ்நாடு'); updateField('currentCountryEn', 'India'); updateField('currentCountryTa', 'இந்தியா'); } else { updateField('currentDistrictEn', ''); updateField('currentDistrictTa', ''); updateField('currentTaluk', ''); updateField('currentCityEn', ''); updateField('currentCityTa', ''); } }} options={districtToStringOptions(DISTRICTS)} />
                        {formData.currentDistrict !== 'OTHER' && <Select label={t('profile_new:current_taluk')} disabled={!formData.currentDistrict} value={formData.currentTaluk || ''} onChange={(val) => { updateField('currentTaluk', val); updateField('currentCityEn', val); updateField('currentCityTa', TALUK_TAMIL[val] || val); }} options={talukToStringOptions(formData.currentDistrict ? TALUKS_BY_DISTRICT[formData.currentDistrict] : [])} placeholder={formData.currentDistrict ? t('profile_new:placeholders.select_taluk') : t('profile_new:placeholders.select_district_first')} />}
                    </div>
                    {formData.currentDistrict === 'OTHER' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                        <TranslatableInput label={t('profile_new:current_city')} valueEn={formData.currentCityEn || ''} valueTa={formData.currentCityTa || ''} onChangeEn={(val) => updateField('currentCityEn', val)} onChangeTa={(val) => updateField('currentCityTa', val)} placeholder={t('profile_new:placeholders.city')} />
                        <TranslatableInput label={t('profile_new:current_state')} valueEn={formData.currentStateEn || ''} valueTa={formData.currentStateTa || ''} onChangeEn={(val) => updateField('currentStateEn', val)} onChangeTa={(val) => updateField('currentStateTa', val)} placeholder={t('profile_new:placeholders.state')} />
                        <TranslatableInput label={t('profile_new:current_country')} valueEn={formData.currentCountryEn || ''} valueTa={formData.currentCountryTa || ''} onChangeEn={(val) => updateField('currentCountryEn', val)} onChangeTa={(val) => updateField('currentCountryTa', val)} placeholder={t('profile_new:placeholders.country')} />
                    </div>)}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gold-soft/5">
                        <Select label={t('profile_new:native_district')} value={formData.nativeDistrict || ''} onChange={(val) => { updateField('nativeDistrict', val); updateField('nativeTaluk', ''); }} options={districtToStringOptions(DISTRICTS)} />
                        {formData.nativeDistrict !== 'OTHER' && <Select label={t('profile_new:native_taluk')} disabled={!formData.nativeDistrict} value={formData.nativeTaluk || ''} onChange={(val) => updateField('nativeTaluk', val)} options={talukToStringOptions(formData.nativeDistrict ? TALUKS_BY_DISTRICT[formData.nativeDistrict] : [])} placeholder={formData.nativeDistrict ? t('profile_new:placeholders.select_taluk') : t('profile_new:placeholders.select_district_first')} />}
                    </div>
                    {formData.nativeDistrict === 'OTHER' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                        <TranslatableInput label={t('profile_new:current_city')} valueEn={formData.currentCityEn || ''} valueTa={formData.currentCityTa || ''} onChangeEn={(val) => updateField('currentCityEn', val)} onChangeTa={(val) => updateField('currentCityTa', val)} placeholder={t('profile_new:placeholders.city')} />
                        <TranslatableInput label={t('profile_new:current_state')} valueEn={formData.currentStateEn || ''} valueTa={formData.currentStateTa || ''} onChangeEn={(val) => updateField('currentStateEn', val)} onChangeTa={(val) => updateField('currentStateTa', val)} placeholder={t('profile_new:placeholders.state')} />
                        <TranslatableInput label={t('profile_new:current_country')} valueEn={formData.currentCountryEn || ''} valueTa={formData.currentCountryTa || ''} onChangeEn={(val) => updateField('currentCountryEn', val)} onChangeTa={(val) => updateField('currentCountryTa', val)} placeholder={t('profile_new:placeholders.country')} />
                    </div>)}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step2Combined — Community + Professional
// ═══════════════════════════════════════════════════════════

const Step2Combined: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">temple_hindu</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.community')}</h3></div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">{t('profile_new:caste')}</label><div className="w-full h-14 flex items-center px-4 bg-ivory border border-gold-soft/20 rounded-xl text-sm font-medium text-rosewood/60 cursor-not-allowed select-none">{t('profile_new:caste_val')}</div></div>
                        <div className="space-y-2"><label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">{t('profile_new:community')}</label><div className="w-full h-14 flex items-center px-4 bg-ivory border border-gold-soft/20 rounded-xl text-sm font-medium text-rosewood/60 cursor-not-allowed select-none">{t('profile_new:community_val')}</div></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gold-soft/5">
                        <Select label={t('profile_new:kulam')} value={formData.kulam || ''} onChange={(val) => updateField('kulam', val)} options={KULAM_OPTIONS} placeholder={t('profile_new:placeholders.kulam')} />
                        <TranslatableInput label={t('profile_new:kuladeivam')} valueEn={formData.kuladeivamEn || ''} valueTa={formData.kuladeivamTa || ''} onChangeEn={(val) => updateField('kuladeivamEn', val)} onChangeTa={(val) => updateField('kuladeivamTa', val)} placeholder={t('profile_new:placeholders.kuladeivam')} />
                    </div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">work</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.career')}</h3></div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label={t('profile_new:education')} icon="school" name="education" value={formData.education || ''} onChange={(e) => updateField('education', e.target.value)} placeholder={t('profile_new:placeholders.education')} />
                        <Select label={t('profile_new:job_sector')} value={formData.jobSector || ''} onChange={(val) => updateField('jobSector', val)} options={JOB_SECTOR_OPTIONS} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label={t('profile_new:job_detail')} icon="work" name="jobDetail" value={formData.jobDetail || ''} onChange={(e) => updateField('jobDetail', e.target.value)} placeholder={t('profile_new:placeholders.job_detail')} />
                        <Input label={t('profile_new:company_name')} icon="apartment" name="companyName" value={formData.companyName || ''} onChange={(e) => updateField('companyName', e.target.value)} placeholder={t('profile_new:placeholders.company_name')} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TranslatableInput label={t('profile_new:job_location')} valueEn={formData.jobLocationEn || ''} valueTa={formData.jobLocationTa || ''} onChangeEn={(val) => updateField('jobLocationEn', val)} onChangeTa={(val) => updateField('jobLocationTa', val)} placeholder={t('profile_new:placeholders.job_location')} />
                        <div><Input label={t('profile_new:salary_monthly')} icon="payments" name="salaryMonthly" type="text" value={formData.salaryMonthly ? formData.salaryMonthly.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('salaryMonthly', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />{formData.salaryMonthly > 0 && (<div className="mt-2 px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">₹ {formData.salaryMonthly.toLocaleString('en-IN')} / {t('common:month')}</span></div>)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step3Family
// ═══════════════════════════════════════════════════════════

const Step3Family: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">person</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.father')}</h3></div>
                    <label className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-xl transition-all hover:border-rosewood/30 shadow-sm"><input type="checkbox" checked={formData.fatherIsLate || false} onChange={(e) => updateField('fatherIsLate', e.target.checked)} className="peer hidden" /><div className={`size-4 rounded-md flex items-center justify-center transition-all ${formData.fatherIsLate ? 'bg-rosewood text-white shadow-sm' : 'bg-white border border-gold-soft/30'}`}>{formData.fatherIsLate && <span className="material-symbols-outlined text-xs!">check</span>}</div><span className="text-[10px] font-black tracking-wider text-rosewood-dark">{t('profile_new:is_late')}?</span></label>
                </div>
                <div className="p-6 space-y-6">
                    <TranslatableInput label={t('profile_new:father_name')} valueEn={formData.fatherNameEn || ''} valueTa={formData.fatherNameTa || ''} onChangeEn={(val) => updateField('fatherNameEn', val)} onChangeTa={(val) => updateField('fatherNameTa', val)} icon="person" placeholder={t('profile_new:placeholders.father_name')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input label={t('profile_new:father_job')} icon="work" name="fatherJob" value={formData.fatherJob || ''} onChange={(e) => updateField('fatherJob', e.target.value)} placeholder={t('profile_new:placeholders.father_job')} />
                        <Input label={t('profile_new:father_salary')} icon="payments" name="fatherSalary" type="text" value={formData.fatherSalary ? formData.fatherSalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('fatherSalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                    </div>
                    {formData.fatherSalary > 0 && (<div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">₹ {formData.fatherSalary.toLocaleString('en-IN')} / {t('common:month')}</span></div>)}
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">person_2</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.mother')}</h3></div>
                    <label className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-xl transition-all hover:border-rosewood/30 shadow-sm"><input type="checkbox" checked={formData.motherIsLate || false} onChange={(e) => updateField('motherIsLate', e.target.checked)} className="peer hidden" /><div className={`size-4 rounded-md flex items-center justify-center transition-all ${formData.motherIsLate ? 'bg-rosewood text-white shadow-sm' : 'bg-white border border-gold-soft/30'}`}>{formData.motherIsLate && <span className="material-symbols-outlined text-xs!">check</span>}</div><span className="text-[10px] font-black tracking-wider text-rosewood-dark">{t('profile_new:is_late')}?</span></label>
                </div>
                <div className="p-6 space-y-6">
                    <TranslatableInput label={t('profile_new:mother_name')} valueEn={formData.motherNameEn || ''} valueTa={formData.motherNameTa || ''} onChangeEn={(val) => updateField('motherNameEn', val)} onChangeTa={(val) => updateField('motherNameTa', val)} icon="person_2" placeholder={t('profile_new:placeholders.mother_name')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input label={t('profile_new:mother_job')} icon="work" name="motherJob" value={formData.motherJob || ''} onChange={(e) => updateField('motherJob', e.target.value)} placeholder={t('profile_new:placeholders.mother_job')} />
                        <Input label={t('profile_new:mother_salary')} icon="payments" name="motherSalary" type="text" value={formData.motherSalary ? formData.motherSalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : undefined; if (numVal !== undefined && numVal < 0) return; updateField('motherSalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                    </div>
                    {formData.motherSalary > 0 && (<div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">₹ {formData.motherSalary.toLocaleString('en-IN')} / {t('common:month')}</span></div>)}
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">groups</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:siblings')}</h3></div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">{t('profile_new:no_of_brothers')}</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateField('noOfBrothers', Math.max(0, (formData.noOfBrothers || 0) - 1))} disabled={(formData.noOfBrothers || 0) <= 0} className="size-8 flex items-center justify-center rounded-lg border border-gold-soft/30 bg-white text-rosewood/60 shadow-sm hover:border-rosewood/40 hover:text-rosewood hover:bg-ivory transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <div className="flex-1 text-center bg-white border border-gold-soft/30 rounded-lg py-1.5 shadow-sm">
                                <span className="text-lg font-black text-rosewood">{formData.noOfBrothers ?? 0}</span>
                            </div>
                            <button type="button" onClick={() => updateField('noOfBrothers', Math.min(5, (formData.noOfBrothers || 0) + 1))} disabled={(formData.noOfBrothers || 0) >= 5} className="size-8 flex items-center justify-center rounded-lg bg-rosewood text-white shadow-sm hover:brightness-110 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">{t('profile_new:no_of_sisters')}</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateField('noOfSisters', Math.max(0, (formData.noOfSisters || 0) - 1))} disabled={(formData.noOfSisters || 0) <= 0} className="size-8 flex items-center justify-center rounded-lg border border-gold-soft/30 bg-white text-rosewood/60 shadow-sm hover:border-rosewood/40 hover:text-rosewood hover:bg-ivory transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <div className="flex-1 text-center bg-white border border-gold-soft/30 rounded-lg py-1.5 shadow-sm">
                                <span className="text-lg font-black text-rosewood">{formData.noOfSisters ?? 0}</span>
                            </div>
                            <button type="button" onClick={() => updateField('noOfSisters', Math.min(5, (formData.noOfSisters || 0) + 1))} disabled={(formData.noOfSisters || 0) >= 5} className="size-8 flex items-center justify-center rounded-lg bg-rosewood text-white shadow-sm hover:brightness-110 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step4Assets
// ═══════════════════════════════════════════════════════════

const Step4Assets: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">real_estate_agent</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.property')}</h3></div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Toggle label={t('profile_new:residence')} value={formData.residence || ''} onChange={(val) => updateField('residence', val)} options={RESIDENCE_OPTIONS} name="residence" />
                        <Input label={t('profile_new:vehicle')} icon="directions_car" name="vehicle" value={formData.vehicle || ''} onChange={(e) => updateField('vehicle', e.target.value)} placeholder={t('profile_new:placeholders.vehicle')} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TranslatableTextarea label={t('profile_new:land')} valueEn={formData.landEn || ''} valueTa={formData.landTa || ''} onChangeEn={(val) => updateField('landEn', val)} onChangeTa={(val) => updateField('landTa', val)} placeholder={t('profile_new:placeholders.land')} icon="landscape" />
                        <TranslatableTextarea label={t('profile_new:other_assets')} valueEn={formData.otherAssetsEn || ''} valueTa={formData.otherAssetsTa || ''} onChangeEn={(val) => updateField('otherAssetsEn', val)} onChangeTa={(val) => updateField('otherAssetsTa', val)} placeholder={t('profile_new:placeholders.other_assets')} icon="inventory_2" />
                    </div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
                <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">favorite</span></div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:sections.partner_preferences')}</h3></div>
                <div className="p-6 space-y-6">
                    <RangeSlider min={21} max={40} value={[formData.ageMin ?? 21, formData.ageMax ?? 40]} onChange={(val) => { updateField('ageMin', val[0]); updateField('ageMax', val[1]); }} label={t('profile_new:age_range')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Select label={t('profile_new:height_min')} value={formData.heightMinId?.toString() || ''} onChange={(val) => updateField('heightMinId', val ? parseInt(val) : null)} options={HEIGHT_OPTIONS} />
                        <Select label={t('profile_new:height_max')} value={formData.heightMaxId?.toString() || ''} onChange={(val) => updateField('heightMaxId', val ? parseInt(val) : null)} options={HEIGHT_OPTIONS} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <Input label={t('profile_new:monthly_salary')} icon="payments" name="monthlySalary" type="text" value={formData.monthlySalary ? formData.monthlySalary.toLocaleString('en-IN') : ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const numVal = val !== '' ? parseInt(val) : null; if (numVal !== null && numVal < 0) return; updateField('monthlySalary', numVal); }} placeholder={t('profile_new:placeholders.salary')} inputMode="numeric" />
                            {formData.monthlySalary && formData.monthlySalary > 0 && (<div className="mt-2 px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500"><span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">{t('common:estimated_income')}</span><span className="text-sm font-black text-rosewood">₹ {formData.monthlySalary.toLocaleString('en-IN')} / {t('common:month')}</span></div>)}
                        </div>
                        <TranslatableInput label={t('profile_new:preferred_location')} valueEn={formData.preferredLocationEn || ''} valueTa={formData.preferredLocationTa || ''} onChangeEn={(val) => updateField('preferredLocationEn', val)} onChangeTa={(val) => updateField('preferredLocationTa', val)} placeholder={t('profile_new:placeholders.preferred_location')} icon="location_on" />
                    </div>
                    <TranslatableTextarea label={t('profile_new:expectation')} valueEn={formData.expectationEn || ''} valueTa={formData.expectationTa || ''} onChangeEn={(val) => updateField('expectationEn', val)} onChangeTa={(val) => updateField('expectationTa', val)} placeholder={t('profile_new:placeholders.partner_expectations')} icon="favorite" />
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step5Horoscope
// ═══════════════════════════════════════════════════════════

const Step5Horoscope: React.FC<StepProps & { isUploading?: boolean; uploadingType?: string | null; onFileUpload: (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; }> = ({ formData, updateField, onAction, isUploading: parentIsUploading, uploadingType, onFileUpload, onFileDelete }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useKeyboardFormNavigation({ containerRef, onSubmitLastField: onAction });

    const [activeMethod, setActiveMethod] = useState<'CREATE' | 'UPLOAD' | 'none'>(() => formData.astrology?.mode || 'none');
    const [isGenerating, setIsGenerating] = useState(false);
    const isUploading = parentIsUploading || false;
    const [birthTime, setBirthTime] = useState(formData.astrology?.birthTime || '');
    const [birthPlace, setBirthPlace] = useState<{ name: string; lat?: number; lon?: number }>({ name: formData.astrology?.birthPlaceName || '', lat: formData.astrology?.latitude, lon: formData.astrology?.longitude });
    const [generatedResult, setGeneratedResult] = useState<HoroscopeResult | null>(null);

    const handleMethodSelect = (method: 'CREATE' | 'UPLOAD') => { setActiveMethod(method); updateField('astrology', { ...formData.astrology, mode: method }); };
    const handleResetMethod = () => { setActiveMethod('none'); setGeneratedResult(null); updateField('astrology', { ...formData.astrology, mode: 'none' }); };

    // Helper functions to map indices to form option values
    const mapRasiToFormValue = (rasiIndex: number): string => {
        const rasiSign = SIGNS[rasiIndex]; // e.g., 'Aries'
        // Map from sign name to form value (e.g., 'Aries' -> 'MESHA')
        const rasiMap: Record<string, string> = {
            'Aries': 'MESHA',
            'Taurus': 'VRISHABHA',
            'Gemini': 'MITHUNA',
            'Cancer': 'KATAKA',
            'Leo': 'SIMHA',
            'Virgo': 'KANYA',
            'Libra': 'TULA',
            'Scorpio': 'VRISCHIKA',
            'Sagittarius': 'DHANUS',
            'Capricorn': 'MAKARA',
            'Aquarius': 'KUMBHA',
            'Pisces': 'MEENA'
        };
        return rasiMap[rasiSign] || '';
    };

    const mapNakshatraToFormValue = (nakshatraIndex: number): string => {
        const nakshatra = NAKSHATRAS[nakshatraIndex]; // e.g., 'Ashwini'
        // Map from nakshatra name to form value (e.g., 'Ashwini' -> 'ASHWINI')
        const nakshatraMap: Record<string, string> = {
            'Ashwini': 'ASHWINI',
            'Bharani': 'BHARANI',
            'Krittika': 'KRITTIKA',
            'Rohini': 'ROHINI',
            'Mrigashirsha': 'MRIGASHIRA',
            'Ardra': 'ARDRA',
            'Punarvasu': 'PUNARVASU',
            'Pushya': 'PUSHYA',
            'Ashlesha': 'ASHLESHA',
            'Magha': 'MAGHA',
            'Purva Phalguni': 'PURVA_PHALGUNI',
            'Uttara Phalguni': 'UTTARA_PHALGUNI',
            'Hasta': 'HASTA',
            'Chitra': 'CHITRA',
            'Swati': 'SWATI',
            'Vishakha': 'VISHAKHA',
            'Anuradha': 'ANURADHA',
            'Jyeshtha': 'JYESHTHA',
            'Mula': 'MULA',
            'Purva Ashadha': 'PURVA_ASHADHA',
            'Uttara Ashadha': 'UTTARA_ASHADHA',
            'Shravana': 'SHRAVANA',
            'Dhanistha': 'DHANISHTHA',
            'Shatabhisha': 'SHATABHISHA',
            'Purva Bhadrapada': 'PURVA_BHADRAPADA',
            'Uttara Bhadrapada': 'UTTARA_BHADRAPADA',
            'Revati': 'REVATI'
        };
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
                dateOfBirth: formData.dob,
                timeOfBirth: birthTime,
                location: {
                    displayName: birthPlace.name,
                    latitude: birthPlace.lat,
                    longitude: birthPlace.lon,
                },
            }) as unknown as HoroscopeResult;
            
            // Auto-populate the celestial chart fields (Star/Rasi/Lagnam) in formData
            const starValue = mapNakshatraToFormValue(result.summary.nakshatraIndex);
            const rasiValue = mapRasiToFormValue(result.summary.rasiSignIndex);
            const laganamValue = mapRasiToFormValue(result.summary.lagnaSignIndex);
            
            updateField('astrology', {
                ...formData.astrology,
                mode: 'CREATE',
                birthTime,
                birthPlaceName: result.summary.locationName || birthPlace.name,
                birthLatitude: result.input.location.latitude,
                birthLongitude: result.input.location.longitude,
                timezone: result.meta.timezone,
                ayanamsa: result.meta.ayanamsa,
                horoscopeJson: result,
                generatedAt: new Date().toISOString(),
                // Auto-populate celestial chart fields
                star: starValue,
                rasi: rasiValue,
                laganam: laganamValue
            });
            // Also set top-level fields for review step display
            updateField('star', starValue);
            updateField('rasi', rasiValue);
            updateField('laganam', laganamValue);
            setGeneratedResult(result);
            toast.success(t('profile_new:toasts.horoscope_generated'));
        } catch {
            toast.error(t('profile_new:toasts.error_generating_horoscope'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'rasi' | 'navamsa' | 'full') => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            if (target === 'full') { await onFileUpload(file, 'rasi'); } else { await onFileUpload(file, target as any); }
        } catch (error: any) { console.error('Horoscope upload error:', error); }
    };

    return (
        <div ref={containerRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AnimatePresence mode="wait">
                {activeMethod === 'none' ? (<HoroscopeMethodSelector onSelect={handleMethodSelect} />) : (
                    <motion.div key="active" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="space-y-8">
                        {activeMethod === 'CREATE' && generatedResult ? null : (
                            <button type="button" onClick={handleResetMethod} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/70 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all"><span className="material-symbols-outlined text-sm font-black">arrow_back</span><span className="text-[10px] font-black tracking-widest uppercase">{t('common:back')}</span></button>
                        )}
                        <div className="">
                            {activeMethod === 'CREATE' ? (
                                generatedResult ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <button type="button" onClick={() => setGeneratedResult(null)} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/70 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all"><span className="material-symbols-outlined text-sm font-black">edit</span><span className="text-[10px] font-black tracking-widest uppercase">{t('profile_new:horoscope.edit_details')}</span></button>
                                            <button type="button" onClick={onAction} className="flex items-center justify-center gap-2 px-6 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-sm hover:bg-rosewood-dark transition-all active:scale-[0.98]"><span>{t('common:next')}</span><span className="material-symbols-outlined text-base">arrow_forward</span></button>
                                        </div>
                                        <HoroscopeResults result={generatedResult} loading={false} error={null} />
                                    </div>
                                ) : (
                                    <HoroscopeAutoForm dob={formData.dob} onDobChange={(val) => updateField('dob', val)} birthTime={birthTime} onBirthTimeChange={setBirthTime} birthPlaceName={birthPlace.name} onBirthPlaceChange={setBirthPlace} onGenerate={handleGenerate} isGenerating={isGenerating} />
                                )
                            ) : (
                                <HoroscopeUploadForm onFileUpload={handleFileUpload} onFileDelete={onFileDelete} rasiChartUploadId={formData.astrology?.rasiChartUploadId || null} navamsaChartUploadId={formData.astrology?.navamsaChartUploadId || null} isUploading={isUploading} uploadingType={uploadingType} formData={formData} updateField={updateField} />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step6Gallery
// ═══════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────
// IdentityPortraitUpload
// ───────────────────────────────────────────────────────────

const IdentityPortraitUpload: React.FC<{
    uploadId: string | null; isUploading: boolean; uploadingType?: string | null;
    onUpload: (f: File) => Promise<void>; onReplace: (f: File) => Promise<void>; onRemove: () => Promise<void>;
}> = ({ uploadId, isUploading, uploadingType, onUpload, onReplace, onRemove }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const isProcessing = isUploading && uploadingType === 'photo';

    return (
        <div className="bg-ivory border border-gold/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-ivory/50 px-6 py-5 border-b border-gold-soft flex items-center gap-3">
                <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-base!">account_circle</span>
                </div>
                <div>
                    <h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:gallery.portrait_title')}</h3>
                    <p className="text-[10px] font-medium text-slate-400 tracking-wide">Required · Your main profile photo</p>
                </div>
            </div>

            <div className="p-8 md:p-10">
                {/* Guidance hero */}
                <div className="text-center mb-8">
                    <p className="text-lg md:text-xl font-serif font-semibold text-rosewood/90">Show your best first impression</p>
                    <p className="text-sm text-slate-500 font-medium mt-1.5 max-w-md mx-auto leading-relaxed">
                        Use a clear front-facing portrait. This is the first thing families see.
                    </p>
                </div>

                {/* Photo + Guidelines side by side */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 justify-center">
                    {/* Left: Photo frame + actions */}
                    <div className="flex flex-col items-center gap-5 shrink-0">
                        <div className="relative">
                            <motion.div layout className={`rounded-2xl overflow-hidden transition-all duration-500 ${uploadId ? 'ring-2 ring-gold/30 shadow-xl shadow-rosewood/10' : 'border-2 border-dashed border-gold-soft/40'}`}>
                                <div className="relative w-48 md:w-56 aspect-4/5 bg-ivory">
                                    {uploadId ? (
                                        <MediaImage uploadId={uploadId} alt="Portrait" className="w-full h-full object-cover" />
                                    ) : isProcessing ? null : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8">
                                            <div className="size-20 rounded-full bg-rosewood/5 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-rosewood/25">person</span>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Photo</p>
                                            </div>
                                        </div>
                                    )}
                                    {isProcessing && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-20">
                                            <div className="size-10 rounded-full border-2 border-rosewood/20 border-t-rosewood animate-spin mb-2" />
                                            <p className="text-[9px] animate-pulse text-rosewood font-black tracking-widest uppercase">{t('profile_new:processing')}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                        {isProcessing ? (
                            <div className="h-11" />
                        ) : uploadId ? (
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 px-6 py-3 bg-rosewood text-white rounded-xl text-xs font-black tracking-wider shadow-md hover:bg-rosewood/90 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    <span>{t('common:change')} Photo</span>
                                    <input type="file" className="hidden" accept="image/*"
                                        onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onReplace(f); }} />
                                </label>
                                <button onClick={onRemove}
                                    className="flex items-center gap-2 px-6 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-black text-rosewood/70 hover:text-red-600 hover:border-red-300 hover:shadow-sm transition-all">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    <span>{t('common:remove')}</span>
                                </button>
                            </div>
                        ) : (
                            <label className="inline-flex items-center gap-2 px-8 py-3.5 bg-rosewood text-white rounded-xl text-sm font-black tracking-wider shadow-lg hover:bg-rosewood/90 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]">
                                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                                <span>Upload Portrait</span>
                                <input type="file" className="hidden" accept="image/*"
                                    onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f); }} />
                            </label>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────
// PhotoSlot
// ───────────────────────────────────────────────────────────

const PhotoSlot: React.FC<{
    uploadId: string | null; index: number; isProcessing: boolean;
    onUpload: (f: File) => Promise<void>; onReplace: (f: File) => Promise<void>; onRemove: () => Promise<void>;
}> = ({ uploadId, index, isProcessing, onUpload, onReplace, onRemove }) => {
    const { t } = useTranslation(['profile_new', 'common']);

    return (
        <motion.div layout className="flex flex-col items-center gap-2.5">
            <div className={`rounded-xl overflow-hidden w-full transition-all duration-500 ${uploadId ? 'ring-2 ring-gold/20 shadow-md p-0.5 bg-white' : 'border-2 border-dashed border-gold-soft/30 bg-ivory/50'}`}>
                <div className="relative aspect-[3/4] w-full">
                    {uploadId ? (
                        <MediaImage uploadId={uploadId} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    ) : !isProcessing ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                            <span className="material-symbols-outlined text-3xl text-rosewood/25">image</span>
                            <p className="text-[9px] font-bold text-rosewood/30 uppercase tracking-widest">Photo {index + 1}</p>
                        </div>
                    ) : null}
                    {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-20">
                            <div className="size-8 rounded-full border-2 border-rosewood/20 border-t-rosewood animate-spin mb-1" />
                            <p className="text-[8px] animate-pulse text-rosewood font-black tracking-widest uppercase">{t('profile_new:processing')}</p>
                        </div>
                    )}
                </div>
            </div>
            {!uploadId && !isProcessing && (
                <label className="flex items-center gap-1.5 px-4 py-2 bg-rosewood text-white rounded-xl text-[10px] font-black tracking-wider hover:bg-rosewood/90 hover:shadow-md transition-all cursor-pointer active:scale-[0.97]">
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    <span>{t('common:upload')}</span>
                    <input type="file" className="hidden" accept="image/*"
                        onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f); }} />
                </label>
            )}
            {uploadId && !isProcessing && (
                <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-lg text-[9px] font-black text-rosewood/60 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>{t('common:change')}</span>
                        <input type="file" className="hidden" accept="image/*"
                            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onReplace(f); }} />
                    </label>
                    <button onClick={onRemove}
                        className="flex items-center gap-1 px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-lg text-[9px] font-black text-rosewood/60 hover:text-red-500 hover:border-red-300 hover:shadow-sm transition-all">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>{t('common:remove')}</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
};

// ───────────────────────────────────────────────────────────
// LifestyleGallery
// ───────────────────────────────────────────────────────────

const LifestyleGallery: React.FC<{
    uploadIds: string[]; count: number; isUploading: boolean; uploadingType?: string | null;
    onUpload: (f: File, idx: number) => Promise<void>; onReplace: (f: File, idx: number) => Promise<void>; onRemove: (idx: number) => Promise<void>;
}> = ({ uploadIds, count, isUploading, uploadingType, onUpload, onReplace, onRemove }) => {
    const { t } = useTranslation(['profile_new', 'common']);

    const visibleSlots = Math.min(count + 1, 4);

    return (
        <div className="bg-ivory border border-gold/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-ivory/50 px-6 py-5 border-b border-gold-soft flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-base!">photo_library</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:gallery.lifestyle_title')}</h3>
                        <p className="text-[10px] font-medium text-slate-400 tracking-wide">Optional · Share moments from your life</p>
                    </div>
                </div>
                <motion.span key={count} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                    className="px-3.5 py-1.5 bg-rosewood/5 border border-gold-soft/20 rounded-full text-[10px] font-black text-rosewood tracking-widest">
                    {count} / 4
                </motion.span>
            </div>
            <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 gap-5 max-w-lg mx-auto">
                    {Array.from({ length: visibleSlots }).map((_, idx) => {
                        const uploadId = uploadIds[idx] || null;
                        const isProcessing = isUploading && uploadingType === `gallery_${idx}`;
                        return (
                            <PhotoSlot
                                key={`slot-${idx}`} uploadId={uploadId} index={idx} isProcessing={isProcessing}
                                onUpload={(f) => onUpload(f, idx)}
                                onReplace={(f) => onReplace(f, idx)}
                                onRemove={() => onRemove(idx)} />
                        );
                    })}
                </div>
                <div className="mt-6 pt-4 border-t border-gold-soft/10 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm text-gold/60">lock</span>
                    <span className="text-[10px] font-medium text-slate-400">Only visible to verified matches</span>
                </div>
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────
// Step6Gallery (Main Entry)
// ───────────────────────────────────────────────────────────

const Step6Gallery: React.FC<StepProps & { isUploading?: boolean; uploadingType?: string | null; onFileUpload: (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>; }> = ({ formData, updateField, onAction, isUploading = false, uploadingType, onFileUpload, onFileDelete }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const galleryUploadIds: string[] = (formData as any).galleryUploadIds || [];
    const primaryUploadId = (formData as any).primaryUploadId || null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
            <IdentityPortraitUpload
                uploadId={primaryUploadId} isUploading={isUploading} uploadingType={uploadingType}
                onUpload={async (f) => await onFileUpload(f, 'photo')}
                onReplace={async (f) => { await onFileDelete('photo'); await onFileUpload(f, 'photo'); }}
                onRemove={async () => await onFileDelete('photo')} />

            <LifestyleGallery
                uploadIds={galleryUploadIds} count={galleryUploadIds.length}
                isUploading={isUploading} uploadingType={uploadingType}
                onUpload={async (f, idx) => await onFileUpload(f, 'gallery', idx)}
                onReplace={async (f, idx) => { await onFileDelete('gallery', idx); await onFileUpload(f, 'gallery', idx); }}
                onRemove={async (idx) => await onFileDelete('gallery', idx)} />
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Step7Review
// ═══════════════════════════════════════════════════════════

const Step7Review: React.FC<StepProps> = ({ formData, updateField, onAction }) => {
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
            <div className="bg-ivory/50 px-6 py-3 border-b border-gold-soft flex items-center gap-3 shrink-0"><div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood"><span className="material-symbols-outlined text-base!">{icon}</span></div><h3 className="text-xs font-black tracking-widest text-rosewood uppercase">{title}</h3></div>
            <div className="p-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">{items.map((item, idx) => (<div key={idx} className={`${item.fullWidth ? 'md:col-span-2' : ''} space-y-1`}><p className="text-rosewood/80 font-heading font-semibold text-xs">{item.label}</p><div className="text-[13px] font-bold text-gray-500 leading-relaxed">{(item.value !== undefined && item.value !== null && item.value !== '') ? item.value : (<span className="text-gray-300 italic font-medium">{t('common:profile.not_specified')}</span>)}</div></div>))}</div>
                {children && <div className={items.length > 0 ? 'mt-8 pt-6 border-t border-gold-soft/10' : ''}>{children}</div>}
            </div>
        </div>
    );

    const isCreateMode = formData.astrology?.mode === 'CREATE';
    const horoscopeData = formData.astrology?.horoscopeJson
        ? (typeof formData.astrology.horoscopeJson === 'string' ? JSON.parse(formData.astrology.horoscopeJson) : formData.astrology.horoscopeJson) as HoroscopeResult
        : null;
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
            <div className="bg-ivory border border-gold/20 rounded-xl p-4 flex items-center gap-4 shadow-sm"><div className="size-9 bg-rosewood/5 rounded-lg flex items-center justify-center text-rosewood shrink-0"><span className="material-symbols-outlined text-lg!">info</span></div><div><p className="text-[10px] font-black tracking-widest text-rosewood/40 uppercase">{t('profile_new:review.warning_title')}</p><p className="text-[13px] font-bold text-rosewood tracking-wide leading-snug">{t('profile_new:review.warning_desc')}</p></div></div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gold-soft/20">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-72 shrink-0 bg-linear-to-br from-rosewood/5 to-ivory flex items-center justify-center p-6 md:p-8">
                        <div className="w-32 h-40 md:w-44 md:h-56 rounded-2xl overflow-hidden ring-4 ring-white/80 shadow-xl bg-ivory">
                            {(formData as any).primaryUploadId ? (<MediaImage uploadId={(formData as any).primaryUploadId} alt="Profile" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-ivory text-rosewood/20 text-5xl font-serif font-black">{(formData.firstNameEn || formData.firstNameTa || '?')[0].toUpperCase()}</div>)}
                        </div>
                    </div>
                    <div className="flex-1 p-6 md:p-8">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-rosewood">{isEn ? ([formData.firstNameEn, formData.lastNameEn].filter(Boolean).join(' ') || t('common:profile.not_specified')) : ([formData.firstNameTa, formData.lastNameTa].filter(Boolean).join(' ') || [formData.firstNameEn, formData.lastNameEn].filter(Boolean).join(' ') || t('common:profile.not_specified'))}</h2>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rosewood text-white rounded-lg text-[10px] font-black tracking-wide uppercase shadow-sm shadow-rosewood/10">{formData.dob ? `${calculateAge(formData.dob)} ${t('common:yrs')}` : '---'}</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rosewood/5 text-rosewood border border-rosewood/10 rounded-lg text-[10px] font-black tracking-wide uppercase">{getOptionLabel(GENDER_OPTIONS, formData.gender) || t('common:profile.not_specified')}</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rosewood/5 text-rosewood border border-rosewood/10 rounded-lg text-[10px] font-black tracking-wide uppercase">{getOptionLabel(HEIGHT_OPTIONS, formData.height) || t('common:profile.not_specified')}</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rosewood/5 text-rosewood border border-rosewood/10 rounded-lg text-[10px] font-black tracking-wide uppercase">{formData.weight ? `${formData.weight} kg` : t('common:profile.not_specified')}</span>
                        </div>
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                            <div className="space-y-1"><p className="text-rosewood/80 font-heading font-semibold text-[10px]">{t('profile_new:profile_for')}</p><p className="text-sm font-bold text-slate-700 leading-relaxed">{getOptionLabel(PROFILE_FOR_OPTIONS, formData.profileFor) || <span className="text-slate-300 italic font-medium">{t('common:profile.not_specified')}</span>}</p></div>
                            <div className="space-y-1"><p className="text-rosewood/80 font-heading font-semibold text-[10px]">{t('profile_new:dob')}</p><p className="text-sm font-bold text-slate-700 leading-relaxed">{formData.dob ? new Date(formData.dob).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) : <span className="text-slate-300 italic font-medium">{t('common:profile.not_specified')}</span>}</p></div>
                            <div className="space-y-1"><p className="text-rosewood/80 font-heading font-semibold text-[10px]">{t('profile_new:marital_status')}</p><p className="text-sm font-bold text-slate-700 leading-relaxed">{getOptionLabel(MARITAL_STATUS_OPTIONS, formData.maritalStatus) || <span className="text-slate-300 italic font-medium">{t('common:profile.not_specified')}</span>}</p></div>
                            <div className="space-y-1"><p className="text-rosewood/80 font-heading font-semibold text-[10px]">{t('profile_new:blood_group')}</p><p className="text-sm font-bold text-slate-700 leading-relaxed">{getOptionLabel(BLOOD_GROUP_OPTIONS, formData.bloodGroup) || <span className="text-slate-300 italic font-medium">{t('common:profile.not_specified')}</span>}</p></div>
                            <div className="space-y-1"><p className="text-rosewood/80 font-heading font-semibold text-[10px]">{t('profile_new:diet')}</p><p className="text-sm font-bold text-slate-700 leading-relaxed">{getOptionLabel(DIET_OPTIONS, formData.diet) || <span className="text-slate-300 italic font-medium">{t('common:profile.not_specified')}</span>}</p></div>
                            <div className="space-y-1"><p className="text-rosewood/80 font-heading font-semibold text-[10px]">{t('profile_new:complexion')}</p><p className="text-sm font-bold text-slate-700 leading-relaxed">{getOptionLabel(COMPLEXION_OPTIONS, formData.complexion) || <span className="text-slate-300 italic font-medium">{t('common:profile.not_specified')}</span>}</p></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderSection(t('profile_new:sections.community'), 'temple_hindu', [
                    { label: t('profile_new:caste'), value: t('profile_new:caste_val') },
                    { label: t('profile_new:community'), value: t('profile_new:community_val') },
                    { label: t('profile_new:kulam'), value: getOptionLabel(KULAM_OPTIONS, formData.kulam) },
                    { label: t('profile_new:kuladeivam'), value: isEn ? formData.kuladeivamEn : (formData.kuladeivamTa || formData.kuladeivamEn) },
                ])}
                {renderSection(t('profile_new:professional_details'), 'work', [
                    { label: t('profile_new:education'), value: formData.education, fullWidth: true },
                    { label: t('profile_new:job_sector'), value: getOptionLabel(JOB_SECTOR_OPTIONS, formData.jobSector) },
                    { label: t('profile_new:job_detail'), value: formData.jobDetail },
                    { label: t('profile_new:company_name'), value: formData.companyName },
                    { label: t('profile_new:salary_monthly'), value: formData.salaryMonthly ? `₹${formData.salaryMonthly.toLocaleString()}` : null },
                    { label: t('profile_new:job_location'), value: isEn ? formData.jobLocationEn : (formData.jobLocationTa || formData.jobLocationEn) },
                ])}
                {renderSection(t('profile_new:sections.locations'), 'location_on', [
                    ...(formData.currentDistrict === 'OTHER' ? [
                        { label: t('profile_new:current_city'), value: isEn ? formData.currentCityEn : (formData.currentCityTa || formData.currentCityEn) },
                        { label: t('profile_new:current_state'), value: isEn ? formData.currentStateEn : (formData.currentStateTa || formData.currentStateEn) },
                        { label: t('profile_new:current_country'), value: isEn ? formData.currentCountryEn : (formData.currentCountryTa || formData.currentCountryEn) },
                    ] : [
                        { label: t('profile_new:current_district'), value: formData.currentDistrict ? getLocationLabel('district', formData.currentDistrict) : null },
                        { label: t('profile_new:current_taluk'), value: formData.currentTaluk ? getLocationLabel('taluk', formData.currentTaluk) : null },
                    ]),
                    { label: t('profile_new:native_district'), value: formData.nativeDistrict && formData.nativeDistrict !== 'OTHER' ? getLocationLabel('district', formData.nativeDistrict) : null },
                    { label: t('profile_new:native_taluk'), value: formData.nativeTaluk ? getLocationLabel('taluk', formData.nativeTaluk) : null },
                ])}
                {renderSection(t('profile_new:family_details'), 'family_restroom', [
                    { label: t('profile_new:father_name'), value: (() => { const n = isEn ? formData.fatherNameEn : (formData.fatherNameTa || formData.fatherNameEn); return n ? n + (formData.fatherIsLate ? ` (${t('profile_new:is_late')})` : '') : null; })() },
                    { label: t('profile_new:father_job'), value: formData.fatherJob },
                    { label: t('profile_new:mother_name'), value: (() => { const n = isEn ? formData.motherNameEn : (formData.motherNameTa || formData.motherNameEn); return n ? n + (formData.motherIsLate ? ` (${t('profile_new:is_late')})` : '') : null; })() },
                    { label: t('profile_new:mother_job'), value: formData.motherJob },
                    { label: t('profile_new:no_of_brothers'), value: formData.noOfBrothers ?? 0 },
                    { label: t('profile_new:no_of_sisters'), value: formData.noOfSisters ?? 0 },
                    { label: t('profile_new:father_salary'), value: formData.fatherSalary ? `₹${formData.fatherSalary.toLocaleString()}` : null },
                    { label: t('profile_new:mother_salary'), value: formData.motherSalary ? `₹${formData.motherSalary.toLocaleString()}` : null },
                ])}
                {renderSection(t('profile_new:sections.partner_preferences'), 'favorite', [
                    { label: t('profile_new:age_range'), value: formData.ageMin && formData.ageMax ? `${formData.ageMin} - ${formData.ageMax} ${t('common:yrs')}` : (formData.ageMin ? `${formData.ageMin}+` : (formData.ageMax ? `Up to ${formData.ageMax}` : null)) },
                    { label: t('profile_new:height_min'), value: getOptionLabel(HEIGHT_OPTIONS, formData.heightMinId, true) },
                    { label: t('profile_new:height_max'), value: getOptionLabel(HEIGHT_OPTIONS, formData.heightMaxId, true) },
                    { label: t('profile_new:monthly_salary'), value: formData.monthlySalary ? `₹${formData.monthlySalary.toLocaleString()}` : null },
                    { label: t('profile_new:preferred_location'), value: isEn ? formData.preferredLocationEn : (formData.preferredLocationTa || formData.preferredLocationEn), fullWidth: true },
                    { label: t('profile_new:expectation'), value: isEn ? formData.expectationEn : (formData.expectationTa || formData.expectationEn), fullWidth: true },
                ])}
                {renderSection(t('profile_new:sections.property'), 'real_estate_agent', [
                    { label: t('profile_new:residence'), value: getOptionLabel(RESIDENCE_OPTIONS, formData.residence) },
                    { label: t('profile_new:land'), value: isEn ? formData.landEn : (formData.landTa || formData.landEn) },
                    { label: t('profile_new:vehicle'), value: formData.vehicle },
                    { label: t('profile_new:other_assets'), value: isEn ? formData.otherAssetsEn : (formData.otherAssetsTa || formData.otherAssetsEn) },
                ])}
            </div>

            <div className="w-full">{renderSection(t('profile_new:sections.horoscope_main'), 'auto_awesome', [
                        { label: t('profile_new:star'), value: getOptionLabel(NAKSHATRA_OPTIONS, formData.star, true) },
                        { label: t('profile_new:rasi'), value: getOptionLabel(RASI_OPTIONS, formData.rasi, true) },
                        { label: t('profile_new:laganam'), value: getOptionLabel(RASI_OPTIONS, formData.laganam, true) },
                        { label: t('profile_new:review.chart_generation'), value: isCreateMode ? t('common:create') : t('common:upload') },
                    ], (<div className="space-y-6">{(!formData.astrology?.mode) ? (<div className="bg-ivory/30 border-2 border-dashed border-gold-soft/20 rounded-xl p-6 text-center"><span className="material-symbols-outlined text-3xl text-slate-300 mb-1">auto_awesome_motion</span><p className="text-sm font-bold text-slate-400 italic">{t('common:profile.not_specified')}</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:px-12"><div className="space-y-4"><p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest text-center">{t('profile_new:horoscope.rasi_chart')}</p><div className="bg-ivory/20 rounded-xl p-4 ring-1 ring-gold-soft/10 shadow-inner">{isCreateMode && horoscopeData ? (<D1Chart lagnaSign={horoscopeData.lagna.signIndex} planets={horoscopeData.planets} />) : (<div className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm ring-4 ring-white">{formData.astrology?.rasiChartUploadId ? (<MediaImage uploadId={formData.astrology.rasiChartUploadId} alt="Rasi" className="w-full h-full object-contain" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">{t('common:profile.not_specified')}</div>)}</div>)}</div></div><div className="space-y-4"><p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest text-center">{t('profile_new:horoscope.navamsa_chart')}</p><div className="bg-ivory/20 rounded-xl p-4 ring-1 ring-gold-soft/10 shadow-inner">{isCreateMode && horoscopeData ? (<D9Chart planets={horoscopeData.planets} lagnaNavamsaSignIndex={horoscopeData.lagnaNavamsa.signIndex} />) : (<div className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm ring-4 ring-white">{formData.astrology?.navamsaChartUploadId ? (<MediaImage uploadId={formData.astrology.navamsaChartUploadId} alt="Navamsa" className="w-full h-full object-contain" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">{t('common:profile.not_specified')}</div>)}</div>)}</div></div></div>)}</div>))}</div>

            <div className="w-full">{renderSection(t('profile_new:sections.media'), 'collections', [], (<div className="space-y-4">{formData.primaryUploadId || ((formData.galleryUploadIds?.length ?? 0) > 0) ? (<div>{formData.primaryUploadId && (<div className="mb-4"><p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest mb-2">Glimpse</p><div className="w-28 aspect-4/5 rounded-xl overflow-hidden bg-slate-100 ring-2 ring-white shadow-md"><MediaImage uploadId={formData.primaryUploadId} alt="Glimpse" className="w-full h-full object-cover" /></div></div>)}{((formData.galleryUploadIds?.length ?? 0) > 0) && (<div><p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest mb-2">{t('profile_new:gallery.lifestyle_title')}</p><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{formData.galleryUploadIds.map((id: string, idx: number) => (<div key={`gallery-${idx}`} className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 ring-2 ring-white shadow-md"><MediaImage uploadId={id} alt={`${t('profile_new:gallery.lifestyle_title')} ${idx + 1}`} className="w-full h-full object-cover" /></div>))}</div></div>)}</div>) : (<div className="bg-ivory/30 border-2 border-dashed border-gold-soft/20 rounded-xl p-6 text-center"><span className="material-symbols-outlined text-4xl text-slate-300 mb-2">no_photography</span><p className="text-sm font-bold text-slate-400 italic">{t('common:profile.not_specified')}</p></div>)}</div>))}</div>

            <label className="bg-white border border-gold-soft/10 rounded-xl shadow-sm p-4 flex items-center gap-3 cursor-pointer transition-all hover:border-gold/30">
                <div className="relative flex items-center shrink-0"><input type="checkbox" checked={formData.agreedToTerms || false} onChange={(e) => updateField('agreedToTerms', e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:bg-rosewood checked:border-rosewood outline-none" /><span className="absolute text-white material-symbols-outlined text-sm! opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">check</span></div>
                <span className="text-xs text-slate-600 leading-snug"><span className="font-bold text-rosewood">{t('profile_new:review.terms_notice')}</span><br /><span className="text-slate-400">{t('profile_new:review.terms_sub')}</span></span>
            </label>
        </div>
    );
};



export { NewProfile as default, SouthIndianChart };
