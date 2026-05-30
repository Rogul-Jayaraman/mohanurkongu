import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Edit2, Trash2 } from 'lucide-react';
import type { MandapamAddon } from '@/types/mandapam';

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

interface AddonCardProps {
    addon: MandapamAddon;
    onEdit: (addon: MandapamAddon) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export const AddonCard: React.FC<AddonCardProps> = ({ addon, onEdit, onDelete, onToggleStatus }) => {
    const { language, t } = useLanguage();
    const lang = language === 'ta' ? 'TA' : 'EN';

    const displayName = addon.translations.find(tr => tr.language === lang)?.name
        ?? addon.translations.find(tr => tr.language === 'EN')?.name
        ?? '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="rounded-2xl p-8 flex flex-col h-full transition-all duration-300 bg-ivory-tint border border-primary/30 shadow-sm hover:shadow-md"
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-ivory flex items-center justify-center border border-gold/20 shrink-0">
                    <span className="material-symbols-outlined text-2xl text-rosewood">{resolveIcon(addon.iconName)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-bold text-rosewood">
                        {displayName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-gold/80">
                        ₹{addon.amount.toLocaleString('en-IN')}
                        <span className="text-[10px] text-slate-400 ml-0.5">
                            {addon.pricingType === 'HOURLY' ? t('adminMandapam.addons.perHour') : t('adminMandapam.addons.perEvent')}
                        </span>
                    </p>
                </div>
            </div>

            {!addon.status && (
                <span className="text-[10px] font-bold text-slate-400 mb-3">
                    {t('adminMandapam.addons.inactive')}
                </span>
            )}

            <div className="grow" />

            <div className="space-y-3 pt-5 border-t border-primary/20">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">
                        {t('adminMandapam.common.status')}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${addon.status ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {addon.status ? t('adminMandapam.addons.active') : t('adminMandapam.addons.inactive')}
                        </span>
                        <button
                            onClick={() => onToggleStatus(addon.id, addon.status)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${addon.status ? 'bg-emerald-400' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${addon.status ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(addon)}
                        className="btn-shine flex-1 flex items-center justify-center gap-2 py-3 border border-gold-accent text-rosewood rounded-lg text-xs font-bold hover:bg-primary transition-colors"
                    >
                        <Edit2 size={14} />
                        {t('adminMandapam.common.edit')}
                    </button>
                    <button
                        onClick={() => onDelete(addon.id)}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-200"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
