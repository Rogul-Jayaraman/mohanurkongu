import React from 'react';
import { PackagesHero, PackagesCTA } from '@/components/features/maaligai/Packages';

const PackagesPage: React.FC = () => {
    return (
        <main className="min-h-screen bg-background-light selection:bg-rosewood selection:text-white overflow-x-hidden">
            <PackagesHero />
            <PackagesCTA />
        </main>
    );
};

export default PackagesPage;
