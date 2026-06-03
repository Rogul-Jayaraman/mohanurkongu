import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollToTop } from '../../ui/layout/ScrollToTop';
import { useProfileForm } from '../../../hooks/useProfileForm';
import { useBillingOverviewQuery } from '../../../queries/useMembershipQueries';
import { Spinner } from '../../ui/feedback/Spinner';
import { uploadFile, deleteUpload, saveDraft, resumeDraft, createProfile } from '../../../api/profile.api';
import { formToDraft, draftToForm } from '../../../adapters/profile.adapter';
import { queryKeys } from '../../../queries/queryKeys';
import { getErrorMessage } from '../../../lib/errors';
import { STEP_REQUIRED_FIELDS } from '../../../validation/profile-schema';
import { Step1Personal, Step2Combined, Step3Family, Step4Assets, Step5Horoscope, Step6Gallery, Step7Review } from './form-steps';

const LimitReachedBanner: React.FC<{ current: number; limit: number }> = ({ current, limit }) => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const isTamil = i18n.language === 'ta';
    return (
        <div className="max-w-4xl mx-auto w-full pt-10 lg:pt-16 pb-8 lg:pb-12 px-2 sm:px-4 min-h-full flex flex-col items-center justify-center">
            <div className="rounded-xl border-2 border-rosewood/20 bg-ivory shadow-sm p-12 text-center max-w-lg">
                <div className="w-16 h-16 bg-rosewood/5 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl text-rosewood">block</span>
                </div>
                <h3 className={`${isTamil ? 'text-lg' : 'text-xl'} font-serif font-bold text-rosewood mb-3`}>
                    {isTamil ? 'சுயவிவர வரம்பு எட்டப்பட்டது' : 'Profile Slot Limit Reached'}
                </h3>
                <p className="text-rosewood/60 text-sm mb-2">
                    {isTamil
                        ? `நீங்கள் உங்கள் திட்டத்தின் ${limit} சுயவிவர வரம்பை எட்டிவிட்டீர்கள். மேலும் சுயவிவரங்களை உருவாக்க திட்டத்தை மேம்படுத்தவும்.`
                        : `You have reached your plan's limit of ${limit} profile${limit > 1 ? 's' : ''}. Upgrade your plan to create more profiles.`}
                </p>
                <p className="text-rosewood/40 text-xs mb-8">
                    {isTamil ? `தற்போதைய பயன்பாடு: ${current} / ${limit}` : `Current usage: ${current} / ${limit}`}
                </p>
                <Link
                    to="/manamaalai/my-account?tab=plans"
                    className="inline-block px-8 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-xs hover:bg-rosewood-dark transition-all"
                >
                    {isTamil ? 'திட்டத்தை மேம்படுத்து' : 'Upgrade Plan'}
                </Link>
            </div>
        </div>
    );
};

const NewProfile: React.FC = () => {
    const { t, i18n } = useTranslation(['profile_new', 'common']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setHeaderContent } = useOutletContext<{ setHeaderContent: (content: React.ReactNode) => void }>();
    const { formData, updateField, isDirty, setIsDirty, setFormData, persistDraft, fieldErrors, touchedFields, markTouched, validateStepOnNav, stepErrors } = useProfileForm();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [draftProfileId, setDraftProfileId] = useState<string | null>(null);
    const totalSteps = 7;

    const billingQuery = useBillingOverviewQuery();
    const billingData = billingQuery.data as any;
    const caps = billingData?.capabilities;
    const slotLimit = caps?.profileSlotLimit ?? -1;
    const profileCount = caps?.profileCount ?? 0;
    const slotLimitReached = slotLimit >= 0 && profileCount >= slotLimit && !draftProfileId;

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
                    {stepErrors[currentStep]?.length > 0 && (
                        <span className="text-[10px] font-black text-red-500 ml-1">
                            {stepErrors[currentStep].length} error{(stepErrors[currentStep].length > 1) ? 's' : ''}
                        </span>
                    )}
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
        const draftId = params.get('draft') || params.get('id');
        if (draftId) {
            const loadDraft = async () => {
                try {
                    const draft = await resumeDraft(draftId);
                    const restored = draftToForm(draft as any);
                    setFormData(prev => {
                        const merged = { ...{ profileFor: 'MYSELF', gender: 'MALE', maritalStatus: 'NEVER_MARRIED', diet: 'VEGETARIAN', caste: 'BC', community: 'Kongu Vellalar', noOfBrothers: 0, noOfSisters: 0, fatherIsLate: false, motherIsLate: false, status: 'ACTIVE' as any, astrology: { mode: 'none' } }, ...restored };
                        const currentOtherKeys = ['currentCityEn', 'currentCityTa', 'currentStateEn', 'currentStateTa', 'currentCountryEn', 'currentCountryTa'];
                        const nativeOtherKeys = ['nativeCityEn', 'nativeCityTa', 'nativeStateEn', 'nativeStateTa', 'nativeCountryEn', 'nativeCountryTa'];
                        const preserveIf = (keys: string[], district: string) => {
                            if ((merged as any)[district] === 'OTHER') {
                                for (const key of keys) {
                                    if ((merged as any)[key] == null && (prev as any)[key] != null) (merged as any)[key] = (prev as any)[key];
                                }
                            }
                        };
                        preserveIf(currentOtherKeys, 'currentDistrict');
                        preserveIf(nativeOtherKeys, 'nativeDistrict');
                        return merged;
                    });
                    setIsDirty(false);
                    const { indexedDBStorage } = await import('../../../lib/indexeddb');
                    const existing = await indexedDBStorage.getDraft();
                    if (!existing) await indexedDBStorage.saveDraft(draft as any);
                    setDraftProfileId(draftId);
                } catch (err) {
                  console.error('[loadDraft] Failed to load draft id=%s — error: %o', draftId, err);
                  toast.error('Failed to load draft');
                }
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

    const handleNext = () => {
        const fields = STEP_REQUIRED_FIELDS[currentStep] || [];
        fields.forEach(f => markTouched(f));
        const errors = validateStepOnNav(currentStep);
        if (errors.length > 0) { toast.error(errors[0]); return; }
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
                updateField('primaryUploadUrl', result.url);
            } else if (type === 'rasi' || type === 'navamsa') {
                const idKey = type === 'rasi' ? 'rasiChartUploadId' : 'navamsaChartUploadId';
                const urlKey = type === 'rasi' ? 'rasiChartUploadUrl' : 'navamsaChartUploadUrl';
                updateField('astrology' as any, { ...formData.astrology, [idKey]: result.uploadId, [urlKey]: result.url });
            } else {
                const currentIds = [...(formData.galleryUploadIds || [])];
                const currentUrls = [...(formData.galleryUploadUrls || [])];
                if (index !== undefined && index < currentIds.length) {
                    currentIds[index] = result.uploadId;
                    currentUrls[index] = result.url;
                } else {
                    currentIds.push(result.uploadId);
                    currentUrls.push(result.url);
                }
                updateField('galleryUploadIds' as any, currentIds);
                updateField('galleryUploadUrls' as any, currentUrls);
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
                updateField('primaryUploadUrl', null);
            } else if (type === 'rasi' || type === 'navamsa') {
                const idKey = type === 'rasi' ? 'rasiChartUploadId' : 'navamsaChartUploadId';
                const urlKey = type === 'rasi' ? 'rasiChartUploadUrl' : 'navamsaChartUploadUrl';
                const id = (formData as any).astrology?.[idKey];
                if (id) await deleteUpload(id);
                updateField('astrology' as any, { ...(formData as any).astrology, [idKey]: null, [urlKey]: null });
            } else if (type === 'gallery' && index !== undefined) {
                const ids = [...((formData as any).galleryUploadIds || [])];
                const urls = [...((formData as any).galleryUploadUrls || [])];
                const id = ids[index];
                if (id) await deleteUpload(id);
                ids.splice(index, 1);
                urls.splice(index, 1);
                updateField('galleryUploadIds' as any, ids);
                updateField('galleryUploadUrls' as any, urls);
            }
            toast.success(t('profile_new:toasts.delete_success'));
        } catch { toast.error(t('profile_new:toasts.delete_error')); }
    };

    const handleSaveDraft = async () => {
        if (slotLimitReached) {
            toast.error(t('profile_new:toasts.slot_limit_reached') || 'Profile slot limit reached. Upgrade to save more.');
            return;
        }
        try {
            setIsSavingDraft(true);
            const draft = formToDraft(formData);
            const payload: any = draft;
            if (draftProfileId) payload.profileId = draftProfileId;
            const result = await saveDraft(payload);
            if (result?.profileId && !draftProfileId) setDraftProfileId(result.profileId);
            const { indexedDBStorage } = await import('../../../lib/indexeddb');
            await indexedDBStorage.clearDraft();
            toast.success(t('profile_new:toasts.draft_success'));
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.my() });
            navigate('/manamaalai/my-profiles');
        } catch { toast.error(t('profile_new:toasts.draft_error')); }
        finally { setIsSavingDraft(false); }
    };

    const handleSubmit = async () => {
        if (slotLimitReached) {
            toast.error(t('profile_new:toasts.slot_limit_reached') || 'Profile slot limit reached. Upgrade to create more.');
            return;
        }
        const { validateCreate } = await import('../../../validation/profile-schema');
        const { translateError } = await import('../../../utils/translateError');
        const errors = validateCreate(formData).map(translateError);
        if (errors.length > 0) { toast.error(errors[0]); return; }

        try {
            setIsSubmitting(true);
            const { indexedDBStorage } = await import('../../../lib/indexeddb');
            const draft = formToDraft(formData);
            if (draftProfileId) draft.profileId = draftProfileId;
            await createProfile({ ...draft, agreedToTerms: formData.agreedToTerms || false });
            await indexedDBStorage.clearDraft();
            toast.success(t('profile_new:toasts.success'));
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.my() });
            navigate('/manamaalai/my-profiles');
        } catch { toast.error(t('profile_new:toasts.publish_error')); }
        finally { setIsSubmitting(false); }
    };

    if (slotLimitReached) {
        return <LimitReachedBanner current={profileCount} limit={slotLimit} />;
    }

    return (
        <div className="max-w-4xl mx-auto w-full pt-10 lg:pt-16 pb-8 lg:pb-12 px-2 sm:px-4 min-h-full flex flex-col">
            <form onSubmit={(e: React.FormEvent) => e.preventDefault()} className="flex-1">
                {currentStep === 1 && <Step1Personal formData={formData} updateField={updateField} onAction={handleNext} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} />}
                {currentStep === 2 && <Step2Combined formData={formData} updateField={updateField} onAction={handleNext} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} />}
                {currentStep === 3 && <Step3Family formData={formData} updateField={updateField} onAction={handleNext} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} />}
                {currentStep === 4 && <Step4Assets formData={formData} updateField={updateField} onAction={handleNext} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} />}
                {currentStep === 5 && <Step5Horoscope formData={formData} updateField={updateField} onAction={handleNext} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} onFileUpload={handleImageUpload} onFileDelete={handleImageDelete} isUploading={!!uploadingType} uploadingType={uploadingType} />}
                {currentStep === 6 && <Step6Gallery formData={formData} updateField={updateField} onAction={handleNext} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} onFileUpload={handleImageUpload} onFileDelete={handleImageDelete} isUploading={!!uploadingType} uploadingType={uploadingType} />}
                {currentStep === 7 && <Step7Review formData={formData} updateField={updateField} onAction={handleSubmit} fieldErrors={fieldErrors} touchedFields={touchedFields} markTouched={markTouched} />}
            </form>

            <div className="mt-auto pt-6 border-t border-gold-soft/10">
                <div className="flex flex-row items-center justify-between gap-3">
                    <button onClick={handleBack} disabled={currentStep === 1}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/70 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="hidden sm:inline">{t('common:setup.back')}</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={handleSaveDraft} disabled={currentStep === 1 || isSavingDraft}
                            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/50 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            {isSavingDraft ? <Spinner size="sm" color="rosewood" /> : <span className="material-symbols-outlined text-sm">save</span>}
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

export default NewProfile;
