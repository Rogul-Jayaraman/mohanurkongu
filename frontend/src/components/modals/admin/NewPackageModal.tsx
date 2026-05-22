import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package as PackageIcon, Loader2, Plus, X } from 'lucide-react';
import { TransliteratedInputPreview } from '@/components/ui/forms/TransliteratedInputPreview';
import { useLanguage } from '@/context/LanguageContext';
import { Input } from '@/components/ui/forms/Input';
import { mandapamService, MandapamPackage } from '@/services/mandapamService';
import { toast } from 'sonner';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

const SUGGESTED_FEATURES = [
    { en: "AC Dining Hall", ta: "ஏசி டைனிங் ஹால்" },
    { en: "24/7 Power Backup", ta: "24/7 மின்சார வசதி" },
    { en: "Valet Parking", ta: "வேலட் பார்க்கிங்" },
    { en: "Audio/Video System", ta: "ஆடியோ/வீடியோ சிஸ்டம்" },
    { en: "Bridal Makeup Room", ta: "மணப்பெண் ஒப்பனை அறை" },
    { en: "Guest Rooms", ta: "விருந்தினர் அறைகள்" },
    { en: "Catering Services", ta: "கேட்டரிங் சேவைகள்" },
    { en: "Stage Decoration", ta: "மேடை அலங்காரம்" }
];

interface NewPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: any;
    pkg: MandapamPackage | null;
    onSuccess?: () => void;
}

export const NewPackageModal: React.FC<NewPackageModalProps> = ({ isOpen, onClose, t, pkg, onSuccess }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [nameEn, setNameEn] = useState('');
    const [nameTa, setNameTa] = useState('');
    const [price, setPrice] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [featuresEn, setFeaturesEn] = useState<string[]>([]);
    const [featuresTa, setFeaturesTa] = useState<string[]>([]);
    const [newFeatureEn, setNewFeatureEn] = useState('');
    const [newFeatureTa, setNewFeatureTa] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
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

    useEffect(() => {
        if (isOpen) {
            if (pkg) {
                setNameEn(pkg.nameEn || '');
                setNameTa(pkg.nameTa || '');
                setPrice(pkg.price.toString());
                setIsActive(pkg.isActive);
                setFeaturesEn(pkg.featuresEn || []);
                setFeaturesTa(pkg.featuresTa || []);
            } else {
                setNameEn(''); setNameTa(''); setPrice(''); setIsActive(true); setFeaturesEn([]); setFeaturesTa([]);
            }
        }
    }, [isOpen, pkg]);

    const addFeature = () => {
        if (newFeatureEn.trim()) {
            setFeaturesEn([...featuresEn, newFeatureEn.trim()]);
            setFeaturesTa([...featuresTa, newFeatureTa.trim() || newFeatureEn.trim()]);
            setNewFeatureEn('');
            setNewFeatureTa('');
        }
    };
    const removeFeature = (index: number) => {
        setFeaturesEn(featuresEn.filter((_, i) => i !== index));
        setFeaturesTa(featuresTa.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!nameEn || !price) {
            toast.error(t('common.fillRequired') || 'Please fill in all required fields');
            return;
        }
        try {
            setSubmitting(true);
            const data = {
                nameEn,
                nameTa,
                price: Number(price.replace(/,/g, '')),
                isActive,
                featuresEn,
                featuresTa
            };
            if (pkg) {
                await mandapamService.updatePackage(pkg.id, data);
                toast.success(t('adminMandapam.packages.updateSuccess') || 'Package updated successfully');
            } else {
                await mandapamService.createPackage(data);
                toast.success(t('adminMandapam.packages.createSuccess') || 'Package created successfully');
            }
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save package');
        } finally {
            setSubmitting(false);
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
                        className="absolute inset-0 bg-gold-soft/10 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-gold-soft/5 backdrop-blur-3xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
                    >
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0">
                                        <PackageIcon size={24} className="text-rosewood" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-rosewood tracking-tight truncate leading-tight">
                                            {pkg ? t('adminMandapam.packages.editPackage') : t('adminMandapam.packages.addNewPackage')}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-ivory rounded-full transition-all text-rosewood/40 hover:text-rosewood hover:rotate-90 duration-300 ml-4"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Input
                                                label={t('adminMandapam.packages.packageName')}
                                                name="packageName"
                                                type="text"
                                                value={isTamil ? nameTa : nameEn}
                                                onChange={(e) => {
                                                    if (isTamil) setNameTa(e.target.value);
                                                    else setNameEn(e.target.value);
                                                }}
                                                targetLanguage={isTamil ? 'ta' : 'en'}
                                                placeholder={t('adminMandapam.packages.enterPackageName')}
                                                icon="inventory_2"
                                            />
                                            <TransliteratedInputPreview
                                                text={isTamil ? nameTa : nameEn}
                                                onPreviewChange={(value) => {
                                                    if (isTamil) setNameEn(value);
                                                    else setNameTa(value);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                label={t('adminMandapam.packages.packagePrice')}
                                                name="packagePrice"
                                                type="text"
                                                inputMode="decimal"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                placeholder={t('adminMandapam.packages.enterPrice')}
                                                icon="currency_rupee"
                                                autoFormat={true}
                                            />
                                            {price && Number(price.replace(/,/g, '')) > 0 && (
                                                <div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500">
                                                    <span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5">
                                                        {t('adminMandapam.packages.finalPrice')}
                                                    </span>
                                                    <span className="text-lg font-black text-rosewood">
                                                        ₹ {Number(price.replace(/,/g, '')).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-end gap-2">
                                            <div className="grow space-y-2">
                                                <Input
                                                    label={t('adminMandapam.packages.features')}
                                                    name="features"
                                                    type="text"
                                                    value={isTamil ? newFeatureTa : newFeatureEn}
                                                    onChange={(e) => {
                                                        if (isTamil) setNewFeatureTa(e.target.value);
                                                        else setNewFeatureEn(e.target.value);
                                                    }}
                                                    targetLanguage={isTamil ? 'ta' : 'en'}
                                                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addFeature()}
                                                    placeholder={t('adminMandapam.packages.enterFeature')}
                                                    icon="add_circle"
                                                />
                                                <TransliteratedInputPreview
                                                    text={isTamil ? newFeatureTa : newFeatureEn}
                                                    onPreviewChange={(value) => {
                                                        if (isTamil) setNewFeatureEn(value);
                                                        else setNewFeatureTa(value);
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={addFeature}
                                                className="px-6 h-14 bg-ivory text-rosewood border-2 border-gold/20 font-black rounded-xl hover:bg-gold/10 transition-all text-xs mb-[2px] uppercase tracking-wider"
                                            >
                                                {t('adminMandapam.packages.addFeature')}
                                            </button>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-xl border border-gold/10">
                                            <p className="text-[10px] text-rosewood/40 font-black uppercase tracking-[0.15em] mb-3">{t('adminMandapam.packages.suggestedFeatures') || 'SUGGESTED FEATURES'}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {SUGGESTED_FEATURES.map(sf => (
                                                    <button
                                                        key={sf.en}
                                                        onClick={() => {
                                                            if (!featuresEn.includes(sf.en)) {
                                                                setFeaturesEn([...featuresEn, sf.en]);
                                                                setFeaturesTa([...featuresTa, sf.ta]);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 bg-white border border-gold/10 text-rosewood text-[11px] font-bold rounded-full hover:bg-gold hover:text-white transition-all shadow-sm"
                                                    >
                                                        + {isTamil ? sf.ta : sf.en}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                            {featuresEn.map((feature, index) => (
                                                <div key={index} className="flex items-center justify-between bg-ivory/30 px-4 py-3 rounded-xl border border-gold/5 group hover:border-gold/20 transition-all">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs text-rosewood font-black truncate">{feature}</span>
                                                        <span className="text-[10px] text-rosewood/40 font-bold truncate">{featuresTa[index]}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFeature(index)}
                                                        className="p-1.5 text-rosewood/20 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <Plus className="rotate-45" size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-t border-gold/10 shrink-0">
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 border border-gold/10 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="flex-1 px-6 py-3 bg-rosewood text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : pkg ? t('common.saveChanges') : t('adminMandapam.packages.createPackage')}
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
