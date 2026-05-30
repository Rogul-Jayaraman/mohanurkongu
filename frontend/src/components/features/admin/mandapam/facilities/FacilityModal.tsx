import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Loader2, Save } from 'lucide-react';
import { adminCreateFacility, adminUpdateFacility } from '@/api/mandapam.api';
import { IconPicker } from '@/components/features/admin/mandapam/shared/IconPicker';
import { toast } from 'sonner';
import type { MandapamFacility, TranslationPair } from '@/types/mandapam';

const ICON_FALLBACKS: Record<string, string> = {
    buffet: 'set_meal',
    buffe: 'set_meal',
};

const KNOWN_ICONS = new Set([
    'meeting_room', 'chair', 'table_restaurant', 'local_parking', 'wifi', 'ac_unit',
    'kitchen', 'bathtub', 'deck', 'outdoor_grill', 'music_note', 'videocam',
    'mic', 'theater_comedy', 'stadium', 'pool', 'child_care', 'accessible',
    'elevator', 'escalator', 'security', 'smoke_free', 'fire_extinguisher', 'eco',
    'light', 'sound', 'restaurant', 'cake', 'diamond', 'star',
    'favorite', 'celebration', 'nightlight', 'sunny', 'cloud', 'water',
    'forest', 'cabin', 'festival', 'spa', 'dance', 'camera_alt',
    'album', 'auto_awesome', 'villa', 'home', 'business', 'checkroom',
    'luggage', 'pets', 'set_meal', 'brunch_dining', 'add',
]);

const resolveIcon = (name: string): string => {
    let icon = name
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
    icon = ICON_FALLBACKS[icon] ?? icon;
    return KNOWN_ICONS.has(icon) ? icon : 'add';
};

interface FacilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    facility?: MandapamFacility;
    onSuccess: () => void;
}

export const FacilityModal: React.FC<FacilityModalProps> = ({ isOpen, onClose, facility, onSuccess }) => {
    const { t } = useLanguage();
    const isEdit = !!facility;

    const [iconName, setIconName] = useState('');
    const [enName, setEnName] = useState('');
    const [taName, setTaName] = useState('');
    const [status, setStatus] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (facility) {
                setIconName(facility.iconName);
                setEnName(facility.translations.find(tr => tr.language === 'EN')?.name ?? '');
                setTaName(facility.translations.find(tr => tr.language === 'TA')?.name ?? '');
                setStatus(facility.status);
            } else {
                setIconName('');
                setEnName('');
                setTaName('');
                setStatus(true);
            }
            setIsSaving(false);
        }
    }, [isOpen, facility]);

    const handleSave = async () => {
        if (!iconName.trim() || !enName.trim() || !taName.trim()) {
            toast.error(t('adminMandapam.facilities.fillAllFields'));
            return;
        }

        setIsSaving(true);
        try {
            const name: TranslationPair[] = [
                { language: 'EN', value: enName.trim() },
                { language: 'TA', value: taName.trim() },
            ];

            if (isEdit) {
                await adminUpdateFacility(facility!.id, { iconName: iconName.trim(), name, status });
                toast.success(t('adminMandapam.facilities.updateSuccess'));
            } else {
                await adminCreateFacility({ iconName: iconName.trim(), name });
                toast.success(t('adminMandapam.facilities.createSuccess'));
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.message ?? t('adminMandapam.facilities.somethingWentWrong'));
        } finally {
            setIsSaving(false);
        }
    };

    const footer = (
        <div className="flex items-center justify-end gap-3">
            <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
                {t('adminMandapam.facilities.cancel')}
            </button>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-rosewood rounded-xl hover:bg-rosewood-dark transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('adminMandapam.facilities.save')}
            </button>
        </div>
    );

    return (
        <>
            <ModalShell
                isOpen={isOpen}
                onClose={onClose}
                title={t(isEdit ? 'adminMandapam.facilities.edit' : 'adminMandapam.facilities.addNew')}
                size="md"
                footer={footer}
            >
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.facilities.icon')}
                    </h4>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-ivory flex items-center justify-center border border-gold/20 shrink-0">
                            <span className="material-symbols-outlined text-2xl text-rosewood">{resolveIcon(iconName || 'add')}</span>
                        </div>
                        <input
                            type="text"
                            value={iconName}
                            onChange={(e) => setIconName(e.target.value)}
                            placeholder={t('adminMandapam.facilities.enterIcon')}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                        />
                        <button
                            onClick={() => setShowIconPicker(true)}
                            className="px-4 py-2.5 text-xs font-semibold text-rosewood bg-ivory border border-gold/20 rounded-xl hover:bg-gold hover:text-white transition-all"
                        >
                            {t('adminMandapam.facilities.pickIcon')}
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.facilities.name')}
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('adminMandapam.facilities.englishLabel')}</label>
                            <input
                                type="text"
                                value={enName}
                                onChange={(e) => setEnName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('adminMandapam.facilities.tamilLabel')}</label>
                            <input
                                type="text"
                                value={taName}
                                onChange={(e) => setTaName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                            />
                        </div>
                    </div>
                </div>

                {isEdit && (
                    <div>
                        <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                            {t('adminMandapam.facilities.status')}
                        </h4>
                        <div className="flex items-center gap-3 px-4 py-3 bg-ivory rounded-xl border border-gold/20">
                            <span className="text-xs font-semibold text-slate-600">
                                {status ? t('adminMandapam.facilities.active') : t('adminMandapam.facilities.inactive')}
                            </span>
                            <button
                                onClick={() => setStatus(!status)}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center p-1 ${
                                    status ? 'bg-rosewood' : 'bg-slate-200'
                                }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 transform ${
                                    status ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>
                    </div>
                )}
            </ModalShell>

            <IconPicker
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                onSelect={(name) => setIconName(name)}
            />
        </>
    );
};
