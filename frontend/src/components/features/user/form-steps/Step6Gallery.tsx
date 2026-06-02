import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { StepProps } from './types';

// ───────────────────────────────────────────────────────────
// IdentityPortraitUpload
// ───────────────────────────────────────────────────────────

const IdentityPortraitUpload: React.FC<{
    uploadId: string | null; uploadUrl?: string | null; isUploading: boolean; uploadingType?: string | null;
    onUpload: (f: File) => Promise<void>; onReplace: (f: File) => Promise<void>; onRemove: () => Promise<void>;
}> = ({ uploadId, uploadUrl, isUploading, uploadingType, onUpload, onReplace, onRemove }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const isProcessing = isUploading && uploadingType === 'photo';

    return (
        <div className="bg-ivory border border-gold/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-ivory/50 px-6 py-5 border-b border-gold-soft flex items-center gap-3">
                <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center"><span className="material-symbols-outlined text-base!">account_circle</span></div>
                <div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:gallery.portrait_title')}</h3><p className="text-[10px] font-medium text-slate-400 tracking-wide">Required · Your main profile photo</p></div>
            </div>
            <div className="p-8 md:p-10">
                <div className="text-center mb-8"><p className="text-lg md:text-xl font-serif font-semibold text-rosewood/90">Show your best first impression</p><p className="text-sm text-slate-500 font-medium mt-1.5 max-w-md mx-auto leading-relaxed">Use a clear front-facing portrait. This is the first thing families see.</p></div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 justify-center">
                    <div className="flex flex-col items-center gap-5 shrink-0">
                        <div className="relative">
                            <motion.div layout className={`rounded-2xl overflow-hidden transition-all duration-500 ${uploadId ? 'ring-2 ring-gold/30 shadow-xl shadow-rosewood/10' : 'border-2 border-dashed border-gold-soft/40'}`}>
                                <div className="relative w-48 md:w-56 aspect-4/5 bg-ivory">
                                    {uploadId ? (
                                        <img src={uploadUrl || ''} alt="Portrait" className="w-full h-full object-cover" />
                                    ) : isProcessing ? null : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8">
                                            <div className="size-20 rounded-full bg-rosewood/5 flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-rosewood/25">person</span></div>
                                            <div className="text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Photo</p></div>
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
                        {isProcessing ? (<div className="h-11" />) : uploadId ? (
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 px-6 py-3 bg-rosewood text-white rounded-xl text-xs font-black tracking-wider shadow-md hover:bg-rosewood/90 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
                                    <span className="material-symbols-outlined text-sm">edit</span><span>{t('common:change')} Photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onReplace(f); }} />
                                </label>
                                <button onClick={onRemove} className="flex items-center gap-2 px-6 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-black text-rosewood/70 hover:text-red-600 hover:border-red-300 hover:shadow-sm transition-all">
                                    <span className="material-symbols-outlined text-sm">delete</span><span>{t('common:remove')}</span>
                                </button>
                            </div>
                        ) : (
                            <label className="inline-flex items-center gap-2 px-8 py-3.5 bg-rosewood text-white rounded-xl text-sm font-black tracking-wider shadow-lg hover:bg-rosewood/90 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]">
                                <span className="material-symbols-outlined text-lg">cloud_upload</span><span>Upload Portrait</span>
                                <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f); }} />
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
    uploadId: string | null; uploadUrl?: string | null; index: number; isProcessing: boolean;
    onUpload: (f: File) => Promise<void>; onReplace: (f: File) => Promise<void>; onRemove: () => Promise<void>;
}> = ({ uploadId, uploadUrl, index, isProcessing, onUpload, onReplace, onRemove }) => {
    const { t } = useTranslation(['profile_new', 'common']);

    return (
        <motion.div layout className="flex flex-col items-center gap-2.5">
            <div className={`rounded-xl overflow-hidden w-full transition-all duration-500 ${uploadId ? 'ring-2 ring-gold/20 shadow-md p-0.5 bg-white' : 'border-2 border-dashed border-gold-soft/30 bg-ivory/50'}`}>
                <div className="relative aspect-[3/4] w-full">
                    {uploadId ? (
                        <img src={uploadUrl || ''} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
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
                    <span className="material-symbols-outlined text-sm">cloud_upload</span><span>{t('common:upload')}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f); }} />
                </label>
            )}
            {uploadId && !isProcessing && (
                <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-lg text-[9px] font-black text-rosewood/60 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">edit</span><span>{t('common:change')}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onReplace(f); }} />
                    </label>
                    <button onClick={onRemove} className="flex items-center gap-1 px-3 py-1.5 bg-ivory border border-gold-soft/30 rounded-lg text-[9px] font-black text-rosewood/60 hover:text-red-500 hover:border-red-300 hover:shadow-sm transition-all">
                        <span className="material-symbols-outlined text-[14px]">delete</span><span>{t('common:remove')}</span>
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
    uploadIds: string[]; uploadUrls?: string[]; count: number; isUploading: boolean; uploadingType?: string | null;
    onUpload: (f: File, idx: number) => Promise<void>; onReplace: (f: File, idx: number) => Promise<void>; onRemove: (idx: number) => Promise<void>;
}> = ({ uploadIds, uploadUrls = [], count, isUploading, uploadingType, onUpload, onReplace, onRemove }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const visibleSlots = Math.min(count + 1, 4);

    return (
        <div className="bg-ivory border border-gold/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-ivory/50 px-6 py-5 border-b border-gold-soft flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center"><span className="material-symbols-outlined text-base!">photo_library</span></div>
                    <div><h3 className="text-sm font-serif font-bold text-rosewood">{t('profile_new:gallery.lifestyle_title')}</h3><p className="text-[10px] font-medium text-slate-400 tracking-wide">Optional · Share moments from your life</p></div>
                </div>
                <motion.span key={count} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="px-3.5 py-1.5 bg-rosewood/5 border border-gold-soft/20 rounded-full text-[10px] font-black text-rosewood tracking-widest">{count} / 4</motion.span>
            </div>
            <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 gap-5 max-w-lg mx-auto">
                    {Array.from({ length: visibleSlots }).map((_, idx) => {
                        const id = uploadIds[idx] || null;
                        const url = uploadUrls?.[idx] || null;
                        const isProcessing = isUploading && uploadingType === `gallery_${idx}`;
                        return (<PhotoSlot key={`slot-${idx}`} uploadId={id} uploadUrl={url} index={idx} isProcessing={isProcessing} onUpload={(f) => onUpload(f, idx)} onReplace={(f) => onReplace(f, idx)} onRemove={() => onRemove(idx)} />);
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

// ═══════════════════════════════════════════════════════════
// Step6Gallery
// ═══════════════════════════════════════════════════════════

interface Step6Props extends StepProps {
    isUploading?: boolean;
    uploadingType?: string | null;
    onFileUpload: (file: File, type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>;
    onFileDelete: (type: 'photo' | 'rasi' | 'navamsa' | 'gallery', index?: number) => Promise<void>;
}

const Step6Gallery: React.FC<Step6Props> = ({ formData, onFileUpload, onFileDelete, isUploading = false, uploadingType }) => {
    const { t } = useTranslation(['profile_new', 'common']);
    const galleryUploadIds: string[] = (formData as any).galleryUploadIds || [];
    const galleryUploadUrls: string[] = (formData as any).galleryUploadUrls || [];
    const primaryUploadId = (formData as any).primaryUploadId || null;
    const primaryUploadUrl = (formData as any).primaryUploadUrl || null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
            <IdentityPortraitUpload
                uploadId={primaryUploadId} uploadUrl={primaryUploadUrl} isUploading={isUploading} uploadingType={uploadingType}
                onUpload={async (f) => await onFileUpload(f, 'photo')}
                onReplace={async (f) => { await onFileDelete('photo'); await onFileUpload(f, 'photo'); }}
                onRemove={async () => await onFileDelete('photo')} />
            <LifestyleGallery
                uploadIds={galleryUploadIds} uploadUrls={galleryUploadUrls} count={galleryUploadIds.length}
                isUploading={isUploading} uploadingType={uploadingType}
                onUpload={async (f, idx) => await onFileUpload(f, 'gallery', idx)}
                onReplace={async (f, idx) => { await onFileDelete('gallery', idx); await onFileUpload(f, 'gallery', idx); }}
                onRemove={async (idx) => await onFileDelete('gallery', idx)} />
        </div>
    );
};

export default Step6Gallery;
