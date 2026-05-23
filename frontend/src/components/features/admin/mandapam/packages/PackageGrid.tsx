import React from 'react';
import type { MandapamPackage } from '@/types/admin-types';
import { PackageCard } from './PackageCard';

interface PackageGridProps {
    t: any;
    packages: MandapamPackage[];
    onEdit: (pkg: MandapamPackage) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onDelete?: (id: string) => void;
}

export const PackageGrid: React.FC<PackageGridProps> = ({ t, packages, onEdit, onToggleStatus, onDelete }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 px-1">
            {packages.map((pkg) => (
                <PackageCard 
                    key={pkg.id}
                    t={t}
                    pkg={pkg}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};



