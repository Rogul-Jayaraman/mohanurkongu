import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { MandapamAddon } from '@/types/mandapam';
import { AddonCard } from './AddonCard';

interface AddonGridProps {
    addons: MandapamAddon[];
    onEdit: (addon: MandapamAddon) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export const AddonGrid: React.FC<AddonGridProps> = ({ addons, onEdit, onDelete, onToggleStatus }) => {
    const { t } = useLanguage();

    if (addons.length === 0) {
        return (
            <div className="text-center py-16 bg-ivory-tint border-2 border-dashed border-primary/20 rounded-2xl">
                <p className="text-rosewood/60 font-medium">
                    {t('adminMandapam.addons.noAddonsFound')}
                </p>
                <p className="text-rosewood/40 text-sm mt-2">
                    {t('adminMandapam.addons.noAddonsDesc')}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {addons.map((addon) => (
                <AddonCard
                    key={addon.id}
                    addon={addon}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
};
