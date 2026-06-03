import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Loader2, Save } from 'lucide-react';
import { useCreateAddon, useUpdateAddon } from '@/queries/useMandapamMutations';
import { IconPicker } from '@/components/features/admin/mandapam/shared/IconPicker';
import TranslatableInput from '@/components/ui/forms/TranslatableInput';
import { toast } from 'sonner';
import type { MandapamAddon, TranslationPair } from '@/types/mandapam';

const ICON_FALLBACKS: Record<string, string> = {
    buffet: 'set_meal',
    buffe: 'set_meal',
};

const KNOWN_ICONS = new Set([
    'meeting_room', 'chair', 'table_restaurant', 'local_parking', 'wifi', 'ac_unit',
    'kitchen', 'bathtub', 'deck', 'outdoor_grill', 'music_note', 'videocam',
    'mic', 'theater_comedy', 'stadium', 'pool', 'child_care', 'accessible',
    'elevator', 'escalator', 'security', 'smoke_free', 'fire_extinguisher', 'eco',
    'light', 'surround_sound', 'restaurant', 'cake', 'diamond', 'star',
    'favorite', 'celebration', 'nightlight', 'sunny', 'cloud', 'water',
    'forest', 'cabin', 'festival', 'spa', 'self_improvement', 'camera_alt',
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

interface AddonModalProps {
    isOpen: boolean;
    onClose: () => void;
    addon?: MandapamAddon;
    onSuccess: () => void;
}

export const AddonModal: React.FC<AddonModalProps> = ({ isOpen, onClose, addon, onSuccess }) => {
    const { t } = useLanguage();
    const isEdit = !!addon;

    const [iconName, setIconName] = useState('');
    const [enName, setEnName] = useState('');
    const [taName, setTaName] = useState('');
    const [pricingType, setPricingType] = useState<'PER_EVENT' | 'PER_HOUR' | 'PER_DAY'>('PER_EVENT');
    const [supportsQuantity, setSupportsQuantity] = useState(false);
    const [status, setStatus] = useState(true);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const createAddon = useCreateAddon();
    const updateAddon = useUpdateAddon();
    const isSaving = createAddon.isPending || updateAddon.isPending;

    useEffect(() => {
        if (isOpen) {
            if (addon) {
                setIconName(addon.iconName);
                setEnName(addon.translations.find(tr => tr.language === 'EN')?.name ?? '');
                setTaName(addon.translations.find(tr => tr.language === 'TA')?.name ?? '');
                setPricingType(addon.pricingType as any);
                setSupportsQuantity(addon.supportsQuantity);
                setStatus(addon.status);
            } else {
                setIconName('');
                setEnName('');
                setTaName('');
                setPricingType('PER_EVENT');
                setSupportsQuantity(false);
                setStatus(true);
            }
        }
    }, [isOpen, addon]);

    const handleSave = async () => {
        if (!iconName.trim() || !enName.trim() || !taName.trim()) {
            toast.error(t('adminMandapam.addons.fillAllFields'));
            return;
        }

        const name: TranslationPair[] = [
            { language: 'EN', value: enName.trim() },
            { language: 'TA', value: taName.trim() },
        ];

        if (isEdit) {
            await updateAddon.mutateAsync({ id: addon!.id, dto: { iconName: iconName.trim(), pricingType, supportsQuantity, name, status } });
        } else {
            await createAddon.mutateAsync({ iconName: iconName.trim(), pricingType, supportsQuantity, name });
        }

        onSuccess();
        onClose();
    };

    const footer = (
        <div className="flex items-center justify-end gap-3">
            <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
                {t('adminMandapam.addons.cancel')}
            </button>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-rosewood rounded-xl hover:bg-rosewood-dark transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('adminMandapam.addons.save')}
            </button>
        </div>
    );

    return (
        <>
            <ModalShell
                isOpen={isOpen}
                onClose={onClose}
                title={t(isEdit ? 'adminMandapam.addons.edit' : 'adminMandapam.addons.addNew')}
                size="md"
                footer={footer}
            >
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.addons.icon')}
                    </h4>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-ivory flex items-center justify-center border border-gold/20 shrink-0">
                            <span className="material-symbols-outlined text-2xl text-rosewood">{resolveIcon(iconName || 'add')}</span>
                        </div>
                        <input
                            type="text"
                            value={iconName}
                            onChange={(e) => setIconName(e.target.value)}
                            placeholder={t('adminMandapam.addons.enterIcon')}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                        />
                        <button
                            onClick={() => setShowIconPicker(true)}
                            className="px-4 py-2.5 text-xs font-semibold text-rosewood bg-ivory border border-gold/20 rounded-xl hover:bg-gold hover:text-white transition-all"
                        >
                            {t('adminMandapam.addons.pickIcon')}
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <TranslatableInput
                        label={t('adminMandapam.addons.name')}
                        valueEn={enName}
                        valueTa={taName}
                        onChangeEn={setEnName}
                        onChangeTa={setTaName}
                    />
                </div>

                <div className="mb-6">
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.addons.pricingType')}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {(['PER_EVENT', 'PER_HOUR', 'PER_DAY'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setPricingType(type)}
                                className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                                    pricingType === type
                                        ? 'bg-rosewood border-rosewood text-white shadow-md'
                                        : 'bg-white border-rosewood/10 text-rosewood/60 hover:border-rosewood/30'
                                }`}
                            >
                                {type === 'PER_EVENT' ? (t('adminMandapam.addons.perEvent') || 'Per Event')
                                    : type === 'PER_HOUR' ? (t('adminMandapam.addons.perHour') || 'Per Hour')
                                    : (t('adminMandapam.addons.perDay') || 'Per Day')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.addons.supportsQuantity') || 'Supports Quantity'}
                    </h4>
                    <div className="flex items-center gap-3 px-4 py-3 bg-ivory rounded-xl border border-gold/20">
                        <span className="text-xs font-semibold text-slate-600">
                            {supportsQuantity ? (t('adminMandapam.addons.yes') || 'Yes') : (t('adminMandapam.addons.no') || 'No')}
                        </span>
                        <button
                            type="button"
                            onClick={() => setSupportsQuantity(!supportsQuantity)}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center p-1 cursor-pointer hover:ring-2 hover:ring-rosewood/40 ${
                                supportsQuantity ? 'bg-rosewood' : 'bg-slate-200'
                            }`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 transform ${
                                supportsQuantity ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>
                </div>

                {isEdit && (
                    <div>
                        <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                            {t('adminMandapam.addons.status')}
                        </h4>
                        <div className="flex items-center gap-3 px-4 py-3 bg-ivory rounded-xl border border-gold/20">
                            <span className="text-xs font-semibold text-slate-600">
                                {status ? t('adminMandapam.addons.active') : t('adminMandapam.addons.inactive')}
                            </span>
                            <button
                                onClick={() => setStatus(!status)}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center p-1 cursor-pointer hover:ring-2 hover:ring-rosewood/40 ${
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
