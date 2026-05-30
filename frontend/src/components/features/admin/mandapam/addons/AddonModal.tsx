import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Loader2, Save } from 'lucide-react';
import { adminCreateAddon, adminUpdateAddon } from '@/api/mandapam.api';
import { IconPicker } from '@/components/features/admin/mandapam/shared/IconPicker';
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
    const [pricingType, setPricingType] = useState<'HOURLY' | 'FIXED'>('FIXED');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (addon) {
                setIconName(addon.iconName);
                setEnName(addon.translations.find(tr => tr.language === 'EN')?.name ?? '');
                setTaName(addon.translations.find(tr => tr.language === 'TA')?.name ?? '');
                setPricingType(addon.pricingType);
                setAmount(addon.amount.toString());
                setStatus(addon.status);
            } else {
                setIconName('');
                setEnName('');
                setTaName('');
                setPricingType('FIXED');
                setAmount('');
                setStatus(true);
            }
            setIsSaving(false);
        }
    }, [isOpen, addon]);

    const handleSave = async () => {
        if (!iconName.trim() || !enName.trim() || !taName.trim() || !amount.trim()) {
            toast.error(t('adminMandapam.addons.fillAllFields'));
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error(t('adminMandapam.addons.fillAllFields'));
            return;
        }

        setIsSaving(true);
        try {
            const name: TranslationPair[] = [
                { language: 'EN', value: enName.trim() },
                { language: 'TA', value: taName.trim() },
            ];

            if (isEdit) {
                await adminUpdateAddon(addon!.id, { iconName: iconName.trim(), pricingType, amount: parsedAmount, name, status });
                toast.success(t('adminMandapam.addons.updateSuccess'));
            } else {
                await adminCreateAddon({ iconName: iconName.trim(), pricingType, amount: parsedAmount, name });
                toast.success(t('adminMandapam.addons.createSuccess'));
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.message ?? t('adminMandapam.addons.somethingWentWrong'));
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
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.addons.name')}
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('adminMandapam.addons.englishLabel')}</label>
                            <input
                                type="text"
                                value={enName}
                                onChange={(e) => setEnName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('adminMandapam.addons.tamilLabel')}</label>
                            <input
                                type="text"
                                value={taName}
                                onChange={(e) => setTaName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.addons.pricingType')}
                    </h4>
                    <div className="flex items-center gap-4 px-4 py-3 bg-ivory rounded-xl border border-gold/20">
                        <button
                            onClick={() => setPricingType('FIXED')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                                pricingType === 'FIXED'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-purple-200'
                            }`}
                        >
                            {t('adminMandapam.addons.fixed')}
                        </button>
                        <button
                            onClick={() => setPricingType('HOURLY')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                                pricingType === 'HOURLY'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-purple-200'
                            }`}
                        >
                            {t('adminMandapam.addons.hourly')}
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-sm font-bold text-rosewood mb-4 uppercase tracking-wider">
                        {t('adminMandapam.addons.price')}
                    </h4>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={t('adminMandapam.addons.enterAmount')}
                            className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rosewood/20 focus:border-rosewood transition-all"
                        />
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
