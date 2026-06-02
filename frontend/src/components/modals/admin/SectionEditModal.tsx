import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import { uploadFile, deleteUpload } from '@/api/profile.api';
import { useAdminUpdateProfileMutation } from '@/queries/useAdminMutations';
import { MediaImage } from '@/components/ui/media/MediaImage';
import { Input } from '@/components/ui/forms/Input';
import { TextArea } from '@/components/ui/forms/TextArea';
import DobInput from '@/components/ui/forms/DobInput';
import Select from '@/components/ui/forms/Select';
import Toggle from '@/components/ui/forms/FormToggle';
import RangeSlider from '@/components/ui/forms/RangeSlider';
import TranslatableInput from '@/components/ui/forms/TranslatableInput';
import { TimePicker, LocationAutocomplete, HoroscopeResults } from '@/components/shared/horoscope';
import type { HoroscopeResult } from '@/types/horoscope';
import { SIGNS, NAKSHATRAS } from '@/types/horoscope';
import { Spinner } from '@/components/ui/feedback/Spinner';
import api from '@/lib/api';
import {
    PROFILE_FOR_OPTIONS, GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, DIET_OPTIONS,
    COMPLEXION_OPTIONS, BLOOD_GROUP_OPTIONS, HEIGHT_OPTIONS, JOB_SECTOR_OPTIONS,
    RESIDENCE_OPTIONS, RASI_OPTIONS, NAKSHATRA_OPTIONS, KULAM_OPTIONS
} from '@/constants/index';
import { DISTRICTS, TALUKS_BY_DISTRICT, DISTRICT_TAMIL, TALUK_TAMIL } from '@/constants/locations';
import type { Profile } from '@/types/profile';
import { X, Save, User, Users, Briefcase, Heart, Building2, Map, Camera } from 'lucide-react';

export type SectionKey = 'basic' | 'personal' | 'community' | 'professional' | 'family' | 'assets' | 'partnerPreference' | 'horoscope' | 'photos';

interface SectionEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    section: SectionKey;
    profile: Profile | null;
    onSaved: () => void;
}

const districtToStringOptions = (arr: string[]) => arr.map(s => {
    const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return { value: s, label: { en: formattedEn, ta: DISTRICT_TAMIL[s] || formattedEn } };
});
const talukToStringOptions = (arr: string[]) => arr.map(s => {
    const formattedEn = s.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return { value: s, label: { en: formattedEn, ta: TALUK_TAMIL[s] || formattedEn } };
});

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
                    if (blob.size <= maxBytes || quality <= 0.1) resolve(blob);
                    else tryQuality(Math.max(0.1, quality - 0.1));
                }, 'image/webp', quality);
            };
            tryQuality(0.85);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image for compression')); };
        img.src = url;
    });
};

const getMaxDobDate = (): string => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 21);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
};
const getMinDobDate = (): string => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 40);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
};

const SECTION_META: Record<SectionKey, { title: string; description: string; icon: React.ReactNode }> = {
    basic: { title: 'Basic Info', description: 'Name, gender, date of birth and locations', icon: <User size={16} /> },
    personal: { title: 'Personal Details', description: 'Marital status, diet, height, weight, complexion, blood group', icon: <User size={16} /> },
    community: { title: 'Community', description: 'Kulam and Kuladeivam', icon: <Users size={16} /> },
    professional: { title: 'Professional', description: 'Education, job, company, salary', icon: <Briefcase size={16} /> },
    family: { title: 'Family', description: 'Parents and siblings information', icon: <Heart size={16} /> },
    assets: { title: 'Assets', description: 'Residence, vehicle, land, other assets', icon: <Building2 size={16} /> },
    partnerPreference: { title: 'Partner Preferences', description: 'Age range, height, salary expectation', icon: <Heart size={16} /> },
    horoscope: { title: 'Horoscope', description: 'Star, Rasi, Lagnam, charts', icon: <Map size={16} /> },
    photos: { title: 'Photos', description: 'Profile photo and gallery images', icon: <Camera size={16} /> },
};

interface HoroscopeFormProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
}

const HoroscopeForm: React.FC<HoroscopeFormProps> = ({ formData, updateField }) => {
    const [activeMethod, setActiveMethod] = useState<string>(formData.mode || 'none');
    const [isGenerating, setIsGenerating] = useState(false);
    const [genResult, setGenResult] = useState<HoroscopeResult | null>(formData.horoscopeJson || null);
    const [bTime, setBTime] = useState(formData.birthTime || '');
    const [bPlace, setBPlace] = useState<{ name: string; lat?: number; lon?: number }>(formData.birthPlace || { name: '' });
    const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

    useEffect(() => {
        setActiveMethod(formData.mode || 'none');
        setGenResult(formData.horoscopeJson || null);
        setBTime(formData.birthTime || '');
        setBPlace(formData.birthPlace || { name: '' });
    }, [formData.mode, formData.horoscopeJson, formData.birthTime, formData.birthPlace]);

    const mapRasiToFormValue = (rasiIndex: number): string => {
        const rasiMap: Record<string, string> = {
            'Aries': 'MESHA', 'Taurus': 'VRISHABHA', 'Gemini': 'MITHUNA',
            'Cancer': 'KATAKA', 'Leo': 'SIMHA', 'Virgo': 'KANYA',
            'Libra': 'TULA', 'Scorpio': 'VRISCHIKA', 'Sagittarius': 'DHANUS',
            'Capricorn': 'MAKARA', 'Aquarius': 'KUMBHA', 'Pisces': 'MEENA'
        };
        return rasiMap[SIGNS[rasiIndex]] || '';
    };
    const mapNakshatraToFormValue = (nakshatraIndex: number): string => {
        const nMap: Record<string, string> = {
            'Ashwini': 'ASHWINI', 'Bharani': 'BHARANI', 'Krittika': 'KRITTIKA',
            'Rohini': 'ROHINI', 'Mrigashirsha': 'MRIGASHIRA', 'Ardra': 'ARDRA',
            'Punarvasu': 'PUNARVASU', 'Pushya': 'PUSHYA', 'Ashlesha': 'ASHLESHA',
            'Magha': 'MAGHA', 'Purva Phalguni': 'PURVA_PHALGUNI', 'Uttara Phalguni': 'UTTARA_PHALGUNI',
            'Hasta': 'HASTA', 'Chitra': 'CHITRA', 'Swati': 'SWATI',
            'Vishakha': 'VISHAKHA', 'Anuradha': 'ANURADHA', 'Jyeshtha': 'JYESHTHA',
            'Mula': 'MULA', 'Purva Ashadha': 'PURVA_ASHADHA', 'Uttara Ashadha': 'UTTARA_ASHADHA',
            'Shravana': 'SHRAVANA', 'Dhanistha': 'DHANISHTHA', 'Shatabhisha': 'SHATABHISHA',
            'Purva Bhadrapada': 'PURVA_BHADRAPADA', 'Uttara Bhadrapada': 'UTTARA_BHADRAPADA',
            'Revati': 'REVATI'
        };
        return nMap[NAKSHATRAS[nakshatraIndex]] || '';
    };

    const handleGenerate = async () => {
        if (!formData.dob || !bTime || !bPlace.name || bPlace.lat === undefined || bPlace.lon === undefined) {
            toast.error('Please fill in all birth details'); return;
        }
        setIsGenerating(true);
        try {
            const result = await api.post('/horoscope/generate', {
                dateOfBirth: formData.dob?.split('T')[0] ?? formData.dob,
                timeOfBirth: bTime,
                location: { displayName: bPlace.name, latitude: bPlace.lat, longitude: bPlace.lon },
            }) as unknown as HoroscopeResult;
            if (result.input) {
                result.input.dateOfBirth = formData.dob?.split('T')[0] ?? formData.dob;
            }
            if (result.summary) {
                updateField('star', result.summary.nakshatraIndex !== undefined ? mapNakshatraToFormValue(result.summary.nakshatraIndex) : '');
                updateField('rasi', result.summary.rasiSignIndex !== undefined ? mapRasiToFormValue(result.summary.rasiSignIndex) : '');
                updateField('laganam', result.summary.lagnaSignIndex !== undefined ? mapRasiToFormValue(result.summary.lagnaSignIndex) : '');
            }
            updateField('horoscopeJson', result);
            updateField('mode', 'GENERATED');
            setGenResult(result);
            toast.success('Horoscope regenerated');
        } catch { toast.error('Failed to generate horoscope'); }
        finally { setIsGenerating(false); }
    };

    const handleRegenerate = () => {
        setGenResult(null);
        updateField('horoscopeJson', null);
        updateField('star', null); updateField('rasi', null); updateField('laganam', null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'rasi' | 'navamsa') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingTarget(target);
        try {
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append('file', new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
            fd.append('category', 'horoscope');
            const result = await uploadFile(fd);
            const idKey = `${target}ChartUploadId` as const;
            const urlKey = `${target}ChartUploadUrl` as const;
            updateField(idKey, result.uploadId);
            updateField(urlKey, result.url);
            toast.success('Chart uploaded');
        } catch { toast.error('Upload failed'); }
        finally { setUploadingTarget(null); }
    };

    const handleFileDelete = async (target: 'rasi' | 'navamsa') => {
        const idKey = `${target}ChartUploadId` as const;
        const urlKey = `${target}ChartUploadUrl` as const;
        const id = formData[idKey];
        if (id) await deleteUpload(id).catch(() => {});
        updateField(idKey, null); updateField(urlKey, null);
    };

    const canRenderHoroscopeResults = genResult?.input && genResult?.summary && genResult?.lagnaNavamsa;

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-rosewood mb-2">Horoscope Mode</label>
                <select value={activeMethod} onChange={(e) => { const v = e.target.value; updateField('mode', v); setActiveMethod(v); if (v !== 'GENERATED') { setGenResult(null); updateField('horoscopeJson', null); } }} className="w-full px-3 py-2 bg-white border-2 border-gold/20 rounded-xl text-sm text-rosewood font-medium outline-none focus:border-gold/40">
                    <option value="none">None</option>
                    <option value="GENERATED">Auto Generate</option>
                    <option value="UPLOADED">Upload Charts</option>
                </select>
            </div>
            {activeMethod === 'GENERATED' && (
                <div className="space-y-6">
                    {genResult ? (
                        <div className="space-y-4">
                            {canRenderHoroscopeResults ? (
                                <HoroscopeResults result={genResult} loading={false} error={null} onRegenerate={handleRegenerate} />
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                                    Horoscope data is incomplete. Click Regenerate to create a new chart.
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select label="Star (Nakshatra)" value={formData.star || ''} onChange={(val) => updateField('star', val)} options={NAKSHATRA_OPTIONS} bilingual />
                                <Select label="Rasi" value={formData.rasi || ''} onChange={(val) => updateField('rasi', val)} options={RASI_OPTIONS} bilingual />
                                <Select label="Lagnam" value={formData.laganam || ''} onChange={(val) => updateField('laganam', val)} options={RASI_OPTIONS} bilingual />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Date of Birth" icon="event" name="dob" type="date" value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={(e) => updateField('dob', e.target.value)} min={getMinDobDate()} max={getMaxDobDate()} />
                                <TimePicker value={bTime} onChange={setBTime} label="Birth Time" />
                            </div>
                            <LocationAutocomplete value={bPlace.name} onChange={(val) => setBPlace((prev) => ({ ...prev, name: val }))} onSelect={(loc) => setBPlace({ name: loc.displayName, lat: loc.latitude, lon: loc.longitude })} label="Birth Place" />
                            <div className="flex justify-center pt-2">
                                <button type="button" onClick={handleGenerate} disabled={isGenerating || !bTime || !bPlace.name || !formData.dob} className="flex items-center justify-center gap-2 px-8 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg text-sm hover:bg-rosewood-dark transition-all disabled:opacity-50">
                                    {isGenerating ? <Spinner size="sm" color="white" /> : <span className="material-symbols-outlined text-base">auto_awesome</span>}
                                    <span>{isGenerating ? 'Generating...' : 'Generate Horoscope'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {activeMethod === 'UPLOADED' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(['rasi', 'navamsa'] as const).map((type) => (
                            <div key={type} className="flex flex-col items-center gap-3">
                                <h4 className="text-sm font-bold text-rosewood">{type === 'rasi' ? 'Rasi' : 'Navamsa'} Chart</h4>
                                <div className={`relative rounded-2xl overflow-hidden size-44 border-2 ${formData[`${type}ChartUploadId`] ? 'border-gold/30' : 'border-dashed border-gold-soft/40 bg-ivory/50'}`}>
                                    {formData[`${type}ChartUploadId`] ? <MediaImage uploadId={formData[`${type}ChartUploadId`]} alt={type} className="w-full h-full object-contain" /> : formData[`${type}ChartUploadUrl`] ? <img src={formData[`${type}ChartUploadUrl`]} alt={type} className="w-full h-full object-contain p-2" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-2"><span className="material-symbols-outlined text-4xl text-rosewood/40">cloud_upload</span><p className="text-[10px] font-bold text-rosewood/30 uppercase">Upload</p></div>}
                                    {uploadingTarget === type && <div className="absolute inset-0 flex items-center justify-center bg-white/90"><div className="size-8 border-2 border-rosewood/20 border-t-rosewood animate-spin rounded-full" /></div>}
                                </div>
                                <div className="flex gap-2">
                                    {!formData[`${type}ChartUploadId`] && !formData[`${type}ChartUploadUrl`] ? (
                                        <label className="px-4 py-2 bg-rosewood text-white rounded-xl text-xs font-bold cursor-pointer">Upload<input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, type)} /></label>
                                    ) : (
                                        <><label className="size-9 rounded-xl bg-ivory border border-gold-soft/30 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-lg">edit</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, type)} /></label><button onClick={() => handleFileDelete(type)} className="size-9 rounded-xl bg-ivory border border-gold-soft/30 flex items-center justify-center text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button></>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="Star (Nakshatra)" value={formData.star || ''} onChange={(val) => updateField('star', val)} options={NAKSHATRA_OPTIONS} bilingual required />
                        <Select label="Rasi" value={formData.rasi || ''} onChange={(val) => updateField('rasi', val)} options={RASI_OPTIONS} bilingual required />
                        <Select label="Lagnam" value={formData.laganam || ''} onChange={(val) => updateField('laganam', val)} options={RASI_OPTIONS} bilingual required />
                    </div>
                </div>
            )}
            {activeMethod === 'none' && <div className="p-6 bg-ivory border border-dashed border-gold-soft/30 rounded-xl text-center"><p className="text-sm text-rosewood/50 italic font-medium">No horoscope data set</p></div>}
        </div>
    );
};

interface PhotosFormProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
}

const PhotosForm: React.FC<PhotosFormProps> = ({ formData, updateField }) => {
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState<number | null>(null);

    const handlePhotoUpload = async (file: File) => {
        setUploadingPhoto(true);
        try {
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append('file', new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
            fd.append('category', 'profiles');
            const result = await uploadFile(fd);
            updateField('primaryUploadId', result.uploadId);
            updateField('primaryUploadUrl', result.url);
            toast.success('Photo uploaded');
        } catch { toast.error('Upload failed'); }
        finally { setUploadingPhoto(false); }
    };
    const handlePhotoDelete = async () => {
        const id = formData.primaryUploadId;
        if (id) await deleteUpload(id).catch(() => {});
        updateField('primaryUploadId', null); updateField('primaryUploadUrl', null);
    };
    const handleGalleryUpload = async (file: File, idx: number) => {
        setUploadingGalleryIdx(idx);
        try {
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append('file', new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
            fd.append('category', 'gallery');
            const result = await uploadFile(fd);
            const ids = [...(formData.galleryUploadIds || [])];
            const urls = [...(formData.galleryUploadUrls || [])];
            if (idx < ids.length) { ids[idx] = result.uploadId; urls[idx] = result.url; }
            else { ids.push(result.uploadId); urls.push(result.url); }
            updateField('galleryUploadIds', ids); updateField('galleryUploadUrls', urls);
            toast.success('Gallery image uploaded');
        } catch { toast.error('Upload failed'); }
        finally { setUploadingGalleryIdx(null); }
    };
    const handleGalleryDelete = async (idx: number) => {
        const ids = [...(formData.galleryUploadIds || [])];
        const id = ids[idx];
        if (id) await deleteUpload(id).catch(() => {});
        ids.splice(idx, 1);
        updateField('galleryUploadIds', ids);
    };

    const primaryId = formData.primaryUploadId;
    const galleryIds: string[] = formData.galleryUploadIds || [];

    return (
        <div className="space-y-8">
            <div className="bg-ivory border border-gold/20 rounded-xl p-6">
                <h4 className="text-sm font-bold text-rosewood mb-4">Profile Photo</h4>
                <div className="flex flex-col items-center gap-4">
                    <div className={`relative rounded-2xl overflow-hidden w-48 aspect-4/5 ${primaryId ? 'ring-2 ring-gold/30' : 'border-2 border-dashed border-gold-soft/40 bg-ivory/50'}`}>
                        {primaryId ? <MediaImage uploadId={primaryId} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-2"><span className="material-symbols-outlined text-4xl text-rosewood/25">person</span><p className="text-xs font-bold text-rosewood/30 uppercase">Photo</p></div>}
                        {uploadingPhoto && <div className="absolute inset-0 flex items-center justify-center bg-white/90"><div className="size-8 border-2 border-rosewood/20 border-t-rosewood animate-spin rounded-full" /></div>}
                    </div>
                    <div className="flex gap-2">
                        {primaryId ? (
                            <><label className="flex items-center gap-2 px-4 py-2 bg-rosewood text-white rounded-xl text-xs font-bold cursor-pointer"><span className="material-symbols-outlined text-sm">edit</span>Change<input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handlePhotoUpload(f); }} /></label><button onClick={handlePhotoDelete} className="flex items-center gap-2 px-4 py-2 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-red-500"><span className="material-symbols-outlined text-sm">delete</span>Remove</button></>
                        ) : (
                            <label className="flex items-center gap-2 px-6 py-2 bg-rosewood text-white rounded-xl text-xs font-bold cursor-pointer"><span className="material-symbols-outlined text-sm">cloud_upload</span>Upload Photo<input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handlePhotoUpload(f); }} /></label>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-ivory border border-gold/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4"><h4 className="text-sm font-bold text-rosewood">Gallery</h4><span className="px-3 py-1 bg-rosewood/5 border border-gold-soft/20 rounded-full text-xs font-bold text-rosewood">{galleryIds.length} / 4</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                    {Array.from({ length: Math.min(galleryIds.length + 1, 4) }).map((_, idx) => {
                        const id = galleryIds[idx] || null;
                        const isProcessing = uploadingGalleryIdx === idx;
                        return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <div className={`relative rounded-xl overflow-hidden w-full aspect-[3/4] ${id ? 'ring-2 ring-gold/20' : 'border-2 border-dashed border-gold-soft/30 bg-ivory/50'}`}>
                                    {id ? <MediaImage uploadId={id} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" /> : !isProcessing ? <div className="w-full h-full flex flex-col items-center justify-center gap-1"><span className="material-symbols-outlined text-3xl text-rosewood/25">image</span><p className="text-[9px] font-bold text-rosewood/30 uppercase">Photo {idx + 1}</p></div> : null}
                                    {isProcessing && <div className="absolute inset-0 flex items-center justify-center bg-white/90"><div className="size-6 border-2 border-rosewood/20 border-t-rosewood animate-spin rounded-full" /></div>}
                                </div>
                                {!id && !isProcessing && <label className="flex items-center gap-1 px-3 py-1.5 bg-rosewood text-white rounded-xl text-[10px] font-bold cursor-pointer"><span className="material-symbols-outlined text-sm">cloud_upload</span>Upload<input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleGalleryUpload(f, idx); }} /></label>}
                                {id && !isProcessing && <div className="flex items-center gap-1"><label className="size-7 rounded-lg bg-ivory border border-gold-soft/30 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-sm">edit</span><input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleGalleryUpload(f, idx); }} /></label><button onClick={() => handleGalleryDelete(idx)} className="size-7 rounded-lg bg-ivory border border-gold-soft/30 flex items-center justify-center text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const SectionEditModal: React.FC<SectionEditModalProps> = ({ isOpen, onClose, section, profile, onSaved }) => {
    const { t, language, translateError } = useLanguage();
    const isTamil = language === 'ta';
    const [formData, setFormData] = useState<Record<string, any>>({});
    const updateProfileMut = useAdminUpdateProfileMutation();
    const saving = updateProfileMut.isPending;

    const initFormData = useCallback((p: Profile) => {
        const hJson = (p as any).horoscope?.horoscopeJson;
        let parsedHoro: HoroscopeResult | null = null;
        if (hJson) parsedHoro = typeof hJson === 'string' ? JSON.parse(hJson) : hJson;
        switch (section) {
            case 'basic':
                setFormData({
                    firstNameEn: p.firstNameEn || '', firstNameTa: p.firstNameTa || '',
                    lastNameEn: p.lastNameEn || '', lastNameTa: p.lastNameTa || '',
                    gender: p.gender || 'MALE', dob: p.dob || '',
                    currentDistrict: p.currentDistrict || '', currentTaluk: p.currentTaluk || '',
                    currentCityEn: p.currentCityEn || '', currentCityTa: p.currentCityTa || '',
                    currentStateEn: p.currentStateEn || '', currentStateTa: p.currentStateTa || '',
                    currentCountryEn: p.currentCountryEn || '', currentCountryTa: p.currentCountryTa || '',
                    nativeDistrict: p.nativeDistrict || '', nativeTaluk: p.nativeTaluk || '',
                    nativeCityEn: p.nativeCityEn || '', nativeCityTa: p.nativeCityTa || '',
                    nativeStateEn: p.nativeStateEn || '', nativeStateTa: p.nativeStateTa || '',
                    nativeCountryEn: p.nativeCountryEn || '', nativeCountryTa: p.nativeCountryTa || '',
                });
                break;
            case 'personal':
                setFormData({
                    profileFor: p.profileFor || 'MYSELF', maritalStatus: p.maritalStatus || 'NEVER_MARRIED',
                    diet: p.diet || 'VEGETARIAN', height: p.height || null, weight: p.weight || null,
                    complexion: p.complexion || 'NOT_SPECIFIED', bloodGroup: p.bloodGroup || '',
                });
                break;
            case 'community':
                setFormData({ kulam: p.kulam || '', kuladeivamEn: p.kuladeivamEn || '', kuladeivamTa: p.kuladeivamTa || '' });
                break;
            case 'professional':
                setFormData({
                    education: p.education || '', jobSector: p.jobSector || '', jobDetail: p.jobDetail || '',
                    companyName: p.companyName || '', jobLocationEn: p.jobLocationEn || '', jobLocationTa: p.jobLocationTa || '',
                    salaryMonthly: p.salaryMonthly || null,
                });
                break;
            case 'family':
                setFormData({
                    fatherNameEn: p.fatherNameEn || '', fatherNameTa: p.fatherNameTa || '',
                    fatherIsLate: p.fatherIsLate || false, fatherJob: p.fatherJob || '', fatherSalary: p.fatherSalary || null,
                    motherNameEn: p.motherNameEn || '', motherNameTa: p.motherNameTa || '',
                    motherIsLate: p.motherIsLate || false, motherJob: p.motherJob || '', motherSalary: p.motherSalary || null,
                    noOfBrothers: p.noOfBrothers ?? 0, noOfSisters: p.noOfSisters ?? 0,
                });
                break;
            case 'assets':
                setFormData({ residence: p.residence || '', vehicle: p.vehicle || '', land: p.landEn || '', otherAssets: p.otherAssetsEn || '' });
                break;
            case 'partnerPreference':
                setFormData({
                    ageMin: p.ageMin ?? 21, ageMax: p.ageMax ?? 40,
                    heightMinId: p.heightMinId ?? null, heightMaxId: p.heightMaxId ?? null,
                    monthlySalary: p.monthlySalary || null,
                    expectationNoteEn: p.expectationNoteEn || '', preferredLocationEn: p.preferredLocationEn || '',
                });
                break;
            case 'horoscope':
                setFormData({
                    mode: (p as any).horoscope?.mode || 'none',
                    star: p.star || '', rasi: p.rasi || '', laganam: p.lagnam || p.laganam || '',
                    dob: p.dob || '',
                    birthTime: parsedHoro?.input?.timeOfBirth || '',
                    birthPlace: { name: parsedHoro?.input?.location?.displayName || '', lat: parsedHoro?.input?.location?.latitude, lon: parsedHoro?.input?.location?.longitude },
                    horoscopeJson: parsedHoro,
                    rasiChartUploadId: null, rasiChartUploadUrl: null,
                    navamsaChartUploadId: null, navamsaChartUploadUrl: null,
                });
                break;
            case 'photos':
                setFormData({ primaryUploadId: null, primaryUploadUrl: null, galleryUploadIds: [], galleryUploadUrls: [] });
                break;
        }
    }, [section]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (profile) initFormData(profile);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, profile, initFormData]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const updateField = (field: string, value: any) => {
        setFormData((prev: Record<string, any>) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!profile) return;
        try {
            let payload: Record<string, any>;
            const enBase = { firstName: profile.firstNameEn || '', lastName: profile.lastNameEn || '', fatherName: profile.fatherNameEn || '', motherName: profile.motherNameEn || '', kuladeivam: profile.kuladeivamEn || '' };
            const taBase = { firstName: profile.firstNameTa || '', lastName: profile.lastNameTa || '', fatherName: profile.fatherNameTa || '', motherName: profile.motherNameTa || '', kuladeivam: profile.kuladeivamTa || '' };
            switch (section) {
                case 'basic':
                    payload = {
                        translations: [
                            { language: 'EN', ...enBase, firstName: formData.firstNameEn || '', lastName: formData.lastNameEn || '' },
                            { language: 'TA', ...taBase, firstName: formData.firstNameTa || '', lastName: formData.lastNameTa || '' },
                        ],
                        basic: {
                            gender: formData.gender, dob: formData.dob,
                            currentDistrict: formData.currentDistrict,
                            currentTaluk: formData.currentDistrict !== 'OTHER' ? formData.currentTaluk : null,
                            currentCityEn: formData.currentDistrict === 'OTHER' ? formData.currentCityEn : null,
                            currentCityTa: formData.currentDistrict === 'OTHER' ? formData.currentCityTa : null,
                            currentStateEn: formData.currentDistrict === 'OTHER' ? formData.currentStateEn : null,
                            currentStateTa: formData.currentDistrict === 'OTHER' ? formData.currentStateTa : null,
                            currentCountryEn: formData.currentDistrict === 'OTHER' ? formData.currentCountryEn : null,
                            currentCountryTa: formData.currentDistrict === 'OTHER' ? formData.currentCountryTa : null,
                            nativeDistrict: formData.nativeDistrict,
                            nativeTaluk: formData.nativeDistrict !== 'OTHER' ? formData.nativeTaluk : null,
                            nativeCityEn: formData.nativeDistrict === 'OTHER' ? formData.nativeCityEn : null,
                            nativeCityTa: formData.nativeDistrict === 'OTHER' ? formData.nativeCityTa : null,
                            nativeStateEn: formData.nativeDistrict === 'OTHER' ? formData.nativeStateEn : null,
                            nativeStateTa: formData.nativeDistrict === 'OTHER' ? formData.nativeStateTa : null,
                            nativeCountryEn: formData.nativeDistrict === 'OTHER' ? formData.nativeCountryEn : null,
                            nativeCountryTa: formData.nativeDistrict === 'OTHER' ? formData.nativeCountryTa : null,
                        },
                    };
                    break;
                case 'personal':
                    payload = {
                        basic: {
                            maritalStatus: formData.maritalStatus, diet: formData.diet,
                            height: formData.height ? Number(formData.height) : null,
                            weight: formData.weight ? Number(formData.weight) : null,
                            complexion: formData.complexion, bloodGroup: formData.bloodGroup, profileFor: formData.profileFor,
                        },
                    };
                    break;
                case 'community':
                    payload = {
                        translations: [
                            { language: 'EN', ...enBase, kuladeivam: formData.kuladeivamEn || '' },
                            { language: 'TA', ...taBase, kuladeivam: formData.kuladeivamTa || '' },
                        ],
                        community: { kulam: formData.kulam },
                    };
                    break;
                case 'professional':
                    payload = {
                        professional: {
                            education: formData.education, jobSector: formData.jobSector, jobDetail: formData.jobDetail,
                            companyName: formData.companyName, jobLocationEn: formData.jobLocationEn, jobLocationTa: formData.jobLocationTa,
                            monthlySalary: formData.salaryMonthly ? Number(formData.salaryMonthly) : null,
                        },
                    };
                    break;
                case 'family':
                    payload = {
                        translations: [
                            { language: 'EN', ...enBase, fatherName: formData.fatherNameEn || '', motherName: formData.motherNameEn || '' },
                            { language: 'TA', ...taBase, fatherName: formData.fatherNameTa || '', motherName: formData.motherNameTa || '' },
                        ],
                        family: {
                            fatherAlive: !formData.fatherIsLate, fatherName: formData.fatherNameEn || '',
                            fatherJob: formData.fatherJob || '', fatherSalary: formData.fatherSalary ? Number(formData.fatherSalary) : null,
                            motherAlive: !formData.motherIsLate, motherName: formData.motherNameEn || '',
                            motherJob: formData.motherJob || '', motherSalary: formData.motherSalary ? Number(formData.motherSalary) : null,
                            noOfBrother: formData.noOfBrothers ?? 0, noOfSister: formData.noOfSisters ?? 0,
                        },
                    };
                    break;
                case 'assets':
                    payload = { assets: { residenceType: formData.residence, vehicle: formData.vehicle, landEn: formData.land, otherAssetsEn: formData.otherAssets } };
                    break;
                case 'partnerPreference':
                    payload = {
                        partnerPreference: {
                            ageMin: formData.ageMin ?? null, ageMax: formData.ageMax ?? null,
                            heightMinId: formData.heightMinId ?? null, heightMaxId: formData.heightMaxId ?? null,
                            monthlySalary: formData.monthlySalary ? Number(formData.monthlySalary) : null,
                            expectationNoteEn: formData.expectationNoteEn || '', preferredLocationEn: formData.preferredLocationEn || '',
                        },
                    };
                    break;
                case 'horoscope': {
                    const horo: any = { mode: formData.mode };
                    if (formData.mode !== 'none') {
                        horo.rasi = formData.rasi || null;
                        horo.nakshatra = formData.star || null;
                        horo.lagna = formData.laganam || null;
                        if (formData.mode === 'GENERATED') horo.horoscopeJson = formData.horoscopeJson || null;
                        else {
                            horo.rasiChartUploadId = formData.rasiChartUploadId || null;
                            horo.navamsaChartUploadId = formData.navamsaChartUploadId || null;
                        }
                    }
                    payload = { horoscope: horo };
                    break;
                }
                case 'photos':
                    payload = { photos: { primaryUploadId: formData.primaryUploadId || null, galleryUploadIds: formData.galleryUploadIds || [] } };
                    break;
            }
            await updateProfileMut.mutateAsync({ id: profile.id, data: payload });
            toast.success(isTamil ? 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது' : 'Section updated successfully');
            onSaved();
            onClose();
        } catch (error: any) {
            toast.error(translateError(error) || (isTamil ? 'புதுப்பிப்பு தோல்வியடைந்தது' : 'Update failed'));
        }
    };



    const meta = SECTION_META[section];
    if (!isOpen || !profile) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-white border-2 border-gold/20 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
                        <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-linear-to-br from-rosewood/10 to-rosewood/5 rounded-xl">{meta.icon}</div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm sm:text-base font-black text-rosewood tracking-tight truncate">{meta.title}</h3>
                                        <p className="text-[10px] text-rosewood/40 font-semibold truncate">{meta.description}</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-1.5 bg-rosewood-gradient text-white rounded-full transition-all hover:brightness-110 hover:rotate-90 duration-300 ml-2 shrink-0 shadow-md"><X size={16} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
                                {section === 'basic' && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-rosewood uppercase tracking-widest">Name</h4>
                                            <TranslatableInput label="First Name" icon="person" valueEn={formData.firstNameEn || ''} valueTa={formData.firstNameTa || ''} onChangeEn={(val) => updateField('firstNameEn', val)} onChangeTa={(val) => updateField('firstNameTa', val)} required />
                                            <TranslatableInput label="Last Name" icon="person" valueEn={formData.lastNameEn || ''} valueTa={formData.lastNameTa || ''} onChangeEn={(val) => updateField('lastNameEn', val)} onChangeTa={(val) => updateField('lastNameTa', val)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Toggle label="Gender" value={formData.gender || ''} onChange={(val) => updateField('gender', val)} options={GENDER_OPTIONS} name="gender" required />
                                            <DobInput label="Date of Birth" value={formData.dob?.split('T')[0] || ''} onChange={(val) => updateField('dob', val)} min={getMinDobDate()} max={getMaxDobDate()} required />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-rosewood uppercase tracking-widest">Current Location</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Select label="Current District" value={formData.currentDistrict || ''} onChange={(val) => { updateField('currentDistrict', val); if (val !== 'OTHER') { updateField('currentCityEn', ''); updateField('currentCityTa', ''); updateField('currentStateEn', ''); updateField('currentStateTa', ''); updateField('currentCountryEn', ''); updateField('currentCountryTa', ''); } }} options={districtToStringOptions(DISTRICTS)} required />
                                                {formData.currentDistrict !== 'OTHER' && <Select label="Current Taluk" disabled={!formData.currentDistrict} value={formData.currentTaluk || ''} onChange={(val) => updateField('currentTaluk', val)} options={talukToStringOptions(formData.currentDistrict ? TALUKS_BY_DISTRICT[formData.currentDistrict] : [])} required />}
                                            </div>
                                            {formData.currentDistrict === 'OTHER' && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <TranslatableInput label="City" valueEn={formData.currentCityEn || ''} valueTa={formData.currentCityTa || ''} onChangeEn={(val) => updateField('currentCityEn', val)} onChangeTa={(val) => updateField('currentCityTa', val)} required />
                                                    <TranslatableInput label="State" valueEn={formData.currentStateEn || ''} valueTa={formData.currentStateTa || ''} onChangeEn={(val) => updateField('currentStateEn', val)} onChangeTa={(val) => updateField('currentStateTa', val)} required />
                                                    <TranslatableInput label="Country" valueEn={formData.currentCountryEn || ''} valueTa={formData.currentCountryTa || ''} onChangeEn={(val) => updateField('currentCountryEn', val)} onChangeTa={(val) => updateField('currentCountryTa', val)} required />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-rosewood uppercase tracking-widest">Native Location</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Select label="Native District" value={formData.nativeDistrict || ''} onChange={(val) => { updateField('nativeDistrict', val); if (val !== 'OTHER') updateField('nativeTaluk', ''); }} options={districtToStringOptions(DISTRICTS)} required />
                                                {formData.nativeDistrict !== 'OTHER' && <Select label="Native Taluk" disabled={!formData.nativeDistrict} value={formData.nativeTaluk || ''} onChange={(val) => updateField('nativeTaluk', val)} options={talukToStringOptions(formData.nativeDistrict ? TALUKS_BY_DISTRICT[formData.nativeDistrict] : [])} required />}
                                            </div>
                                            {formData.nativeDistrict === 'OTHER' && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <TranslatableInput label="City" valueEn={formData.nativeCityEn || ''} valueTa={formData.nativeCityTa || ''} onChangeEn={(val) => updateField('nativeCityEn', val)} onChangeTa={(val) => updateField('nativeCityTa', val)} required />
                                                    <TranslatableInput label="State" valueEn={formData.nativeStateEn || ''} valueTa={formData.nativeStateTa || ''} onChangeEn={(val) => updateField('nativeStateEn', val)} onChangeTa={(val) => updateField('nativeStateTa', val)} required />
                                                    <TranslatableInput label="Country" valueEn={formData.nativeCountryEn || ''} valueTa={formData.nativeCountryTa || ''} onChangeEn={(val) => updateField('nativeCountryEn', val)} onChangeTa={(val) => updateField('nativeCountryTa', val)} required />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {section === 'personal' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Select label="Profile For" value={formData.profileFor || ''} onChange={(val) => updateField('profileFor', val)} options={PROFILE_FOR_OPTIONS} required />
                                            <Select label="Marital Status" value={formData.maritalStatus || ''} onChange={(val) => updateField('maritalStatus', val)} options={MARITAL_STATUS_OPTIONS} required />
                                        </div>
                                        <Toggle label="Diet" value={formData.diet || ''} onChange={(val) => updateField('diet', val)} options={DIET_OPTIONS} name="diet" required />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <Select label="Blood Group" value={formData.bloodGroup || ''} onChange={(val) => updateField('bloodGroup', val)} options={BLOOD_GROUP_OPTIONS} required />
                                            <Select label="Height" value={formData.height?.toString() || ''} onChange={(val) => updateField('height', val ? parseInt(val) : null)} options={HEIGHT_OPTIONS} required />
                                            <Input label="Weight (kg)" icon="monitor_weight" name="weight" value={formData.weight?.toString() || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); updateField('weight', v === '' ? null : parseInt(v)); }} inputMode="numeric" />
                                            <Select label="Complexion" value={formData.complexion || 'NOT_SPECIFIED'} onChange={(val) => updateField('complexion', val)} options={COMPLEXION_OPTIONS} />
                                        </div>
                                    </div>
                                )}
                                {section === 'community' && (
                                    <div className="space-y-6">
                                        <p className="text-sm font-medium text-rosewood/60 bg-ivory border border-gold-soft/20 rounded-xl p-4">Caste: BC &middot; Community: Kongu Vellalar</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select label="Kulam" value={formData.kulam || ''} onChange={(val) => updateField('kulam', val)} options={KULAM_OPTIONS} required />
                                            <TranslatableInput label="Kuladeivam" valueEn={formData.kuladeivamEn || ''} valueTa={formData.kuladeivamTa || ''} onChangeEn={(val) => updateField('kuladeivamEn', val)} onChangeTa={(val) => updateField('kuladeivamTa', val)} required />
                                        </div>
                                    </div>
                                )}
                                {section === 'professional' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Education" icon="school" name="education" value={formData.education || ''} onChange={(e) => updateField('education', e.target.value)} />
                                            <Select label="Job Sector" value={formData.jobSector || ''} onChange={(val) => updateField('jobSector', val)} options={JOB_SECTOR_OPTIONS} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Job Detail" icon="work" name="jobDetail" value={formData.jobDetail || ''} onChange={(e) => updateField('jobDetail', e.target.value)} />
                                            <Input label="Company Name" icon="apartment" name="companyName" value={formData.companyName || ''} onChange={(e) => updateField('companyName', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <TranslatableInput label="Job Location" valueEn={formData.jobLocationEn || ''} valueTa={formData.jobLocationTa || ''} onChangeEn={(val) => updateField('jobLocationEn', val)} onChangeTa={(val) => updateField('jobLocationTa', val)} />
                                            <Input label="Monthly Salary" icon="payments" name="salaryMonthly" value={formData.salaryMonthly?.toLocaleString('en-IN') || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); updateField('salaryMonthly', v === '' ? null : parseInt(v)); }} inputMode="numeric" />
                                        </div>
                                    </div>
                                )}
                                {section === 'family' && (
                                    <div className="space-y-6">
                                        <div className="bg-ivory border border-gold/20 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-rosewood">Father</h4>
                                                <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-white border border-gold-soft/30 rounded-xl text-[10px] font-black select-none">
                                                    <input type="checkbox" checked={formData.fatherIsLate || false} onChange={(e) => updateField('fatherIsLate', e.target.checked)} className="hidden" />
                                                    <div className={`size-4 rounded-md flex items-center justify-center ${formData.fatherIsLate ? 'bg-rosewood text-white' : 'bg-white border border-gold-soft/30'}`}>{formData.fatherIsLate && <span className="text-xs">&#x2713;</span>}</div>
                                                    Late?
                                                </label>
                                            </div>
                                            <div className="space-y-4">
                                                <TranslatableInput label="Father Name" icon="person" valueEn={formData.fatherNameEn || ''} valueTa={formData.fatherNameTa || ''} onChangeEn={(val) => updateField('fatherNameEn', val)} onChangeTa={(val) => updateField('fatherNameTa', val)} required />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Input label="Father Job" icon="work" name="fatherJob" value={formData.fatherJob || ''} onChange={(e) => updateField('fatherJob', e.target.value)} />
                                                    <Input label="Father Salary" icon="payments" name="fatherSalary" value={formData.fatherSalary?.toLocaleString('en-IN') || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); updateField('fatherSalary', v === '' ? null : parseInt(v)); }} inputMode="numeric" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-ivory border border-gold/20 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-rosewood">Mother</h4>
                                                <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-white border border-gold-soft/30 rounded-xl text-[10px] font-black select-none">
                                                    <input type="checkbox" checked={formData.motherIsLate || false} onChange={(e) => updateField('motherIsLate', e.target.checked)} className="hidden" />
                                                    <div className={`size-4 rounded-md flex items-center justify-center ${formData.motherIsLate ? 'bg-rosewood text-white' : 'bg-white border border-gold-soft/30'}`}>{formData.motherIsLate && <span className="text-xs">&#x2713;</span>}</div>
                                                    Late?
                                                </label>
                                            </div>
                                            <div className="space-y-4">
                                                <TranslatableInput label="Mother Name" icon="person" valueEn={formData.motherNameEn || ''} valueTa={formData.motherNameTa || ''} onChangeEn={(val) => updateField('motherNameEn', val)} onChangeTa={(val) => updateField('motherNameTa', val)} required />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Input label="Mother Job" icon="work" name="motherJob" value={formData.motherJob || ''} onChange={(e) => updateField('motherJob', e.target.value)} />
                                                    <Input label="Mother Salary" icon="payments" name="motherSalary" value={formData.motherSalary?.toLocaleString('en-IN') || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); updateField('motherSalary', v === '' ? null : parseInt(v)); }} inputMode="numeric" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-rosewood">No. of Brothers</label>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => updateField('noOfBrothers', Math.max(0, (formData.noOfBrothers || 0) - 1))} disabled={(formData.noOfBrothers || 0) <= 0} className="size-8 flex items-center justify-center rounded-lg border border-gold-soft/30 bg-white text-rosewood/60 hover:border-rosewood/40 disabled:opacity-30">&minus;</button>
                                                    <div className="flex-1 text-center bg-white border border-gold-soft/30 rounded-lg py-1.5"><span className="text-lg font-black text-rosewood">{formData.noOfBrothers ?? 0}</span></div>
                                                    <button type="button" onClick={() => updateField('noOfBrothers', Math.min(5, (formData.noOfBrothers || 0) + 1))} disabled={(formData.noOfBrothers || 0) >= 5} className="size-8 flex items-center justify-center rounded-lg bg-rosewood text-white hover:brightness-110 disabled:opacity-40">+</button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-rosewood">No. of Sisters</label>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => updateField('noOfSisters', Math.max(0, (formData.noOfSisters || 0) - 1))} disabled={(formData.noOfSisters || 0) <= 0} className="size-8 flex items-center justify-center rounded-lg border border-gold-soft/30 bg-white text-rosewood/60 hover:border-rosewood/40 disabled:opacity-30">&minus;</button>
                                                    <div className="flex-1 text-center bg-white border border-gold-soft/30 rounded-lg py-1.5"><span className="text-lg font-black text-rosewood">{formData.noOfSisters ?? 0}</span></div>
                                                    <button type="button" onClick={() => updateField('noOfSisters', Math.min(5, (formData.noOfSisters || 0) + 1))} disabled={(formData.noOfSisters || 0) >= 5} className="size-8 flex items-center justify-center rounded-lg bg-rosewood text-white hover:brightness-110 disabled:opacity-40">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {section === 'assets' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Toggle label="Residence" value={formData.residence || ''} onChange={(val) => updateField('residence', val)} options={RESIDENCE_OPTIONS} name="residence" required />
                                            <Input label="Vehicle" icon="directions_car" name="vehicle" value={formData.vehicle || ''} onChange={(e) => updateField('vehicle', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <TextArea label="Land" name="land" value={formData.land || ''} onChange={(e) => updateField('land', e.target.value)} icon="landscape" />
                                            <TextArea label="Other Assets" name="otherAssets" value={formData.otherAssets || ''} onChange={(e) => updateField('otherAssets', e.target.value)} icon="inventory_2" />
                                        </div>
                                    </div>
                                )}
                                {section === 'partnerPreference' && (
                                    <div className="space-y-6">
                                        <RangeSlider min={21} max={40} value={[formData.ageMin ?? 21, formData.ageMax ?? 40]} onChange={(val) => { updateField('ageMin', val[0]); updateField('ageMax', val[1]); }} label="Age Range" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Select label="Min Height" value={formData.heightMinId?.toString() || ''} onChange={(val) => updateField('heightMinId', val ? parseInt(val) : null)} options={HEIGHT_OPTIONS} />
                                            <Select label="Max Height" value={formData.heightMaxId?.toString() || ''} onChange={(val) => updateField('heightMaxId', val ? parseInt(val) : null)} options={HEIGHT_OPTIONS} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input label="Expected Salary" icon="payments" name="monthlySalary" value={formData.monthlySalary?.toLocaleString('en-IN') || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); updateField('monthlySalary', v === '' ? null : parseInt(v)); }} inputMode="numeric" />
                                            <TranslatableInput label="Preferred Location" icon="location_on" valueEn={formData.preferredLocationEn || ''} valueTa={formData.preferredLocationTa || ''} onChangeEn={(val) => updateField('preferredLocationEn', val)} onChangeTa={(val) => updateField('preferredLocationTa', val)} />
                                        </div>
                                        <TextArea label="Expectations" name="expectationNote" value={formData.expectationNoteEn || ''} onChange={(e) => updateField('expectationNoteEn', e.target.value)} icon="favorite" />
                                    </div>
                                )}
                                {section === 'horoscope' && <HoroscopeForm formData={formData} updateField={updateField} />}
                                {section === 'photos' && <PhotosForm formData={formData} updateField={updateField} />}
                            </div>
                            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 backdrop-blur-xl border-t border-gold/10 shrink-0 bg-white/60">
                                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                                    <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border-2 border-gold-soft/30 bg-white text-rosewood font-bold text-xs sm:text-sm hover:shadow-md hover:border-gold/40 transition-all shadow-sm">{isTamil ? 'ரத்து செய்' : 'Cancel'}</button>
                                    <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-rosewood text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}{saving ? (isTamil ? 'சேமிக்கிறது...' : 'Saving...') : (isTamil ? 'சேமி' : 'Save Changes')}</button>
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

export default SectionEditModal;
