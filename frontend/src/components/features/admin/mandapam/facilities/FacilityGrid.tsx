import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { MandapamFacility } from '@/types/mandapam';
import { FacilityCard } from './FacilityCard';

interface FacilityGridProps {
    facilities: MandapamFacility[];
    onEdit: (facility: MandapamFacility) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export const FacilityGrid: React.FC<FacilityGridProps> = ({ facilities, onEdit, onDelete, onToggleStatus }) => {
    const { t } = useLanguage();

    if (facilities.length === 0) {
        return (
            <div className="text-center py-16 bg-ivory-tint border-2 border-dashed border-primary/20 rounded-2xl">
                <p className="text-rosewood/60 font-medium">
                    {t('adminMandapam.facilities.noFacilitiesFound')}
                </p>
                <p className="text-rosewood/40 text-sm mt-2">
                    {t('adminMandapam.facilities.noFacilitiesDesc')}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {facilities.map((facility) => (
                <FacilityCard
                    key={facility.id}
                    facility={facility}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
};
