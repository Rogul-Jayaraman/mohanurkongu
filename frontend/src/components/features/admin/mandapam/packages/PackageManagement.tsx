import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import {
    adminGetAllPackages,
    adminGetAllFacilities,
    adminGetAllAddons,
    adminUpdatePackage,
    adminUpdateFacility,
    adminDeleteFacility,
    adminUpdateAddon,
    adminDeleteAddon,
} from '@/api/mandapam.api';
import { SectionHeader } from '@/components/features/admin/mandapam/shared/SectionHeader';
import { PackageGrid } from './PackageGrid';

import { EditPackageModal } from './EditPackageModal';
import { FacilityGrid } from '@/components/features/admin/mandapam/facilities/FacilityGrid';
import { FacilityModal } from '@/components/features/admin/mandapam/facilities/FacilityModal';
import { AddonGrid } from '@/components/features/admin/mandapam/addons/AddonGrid';
import { AddonModal } from '@/components/features/admin/mandapam/addons/AddonModal';
import type { MandapamPackage, MandapamFacility, MandapamAddon } from '@/types/mandapam';

const PackageManagement: React.FC = () => {
    const { t } = useLanguage();

    const [packages, setPackages] = useState<MandapamPackage[]>([]);
    const [facilities, setFacilities] = useState<MandapamFacility[]>([]);
    const [addons, setAddons] = useState<MandapamAddon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const [editPackage, setEditPackage] = useState<MandapamPackage | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [editFacility, setEditFacility] = useState<MandapamFacility | undefined>(undefined);
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);

    const [editAddon, setEditAddon] = useState<MandapamAddon | undefined>(undefined);
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

    const fetchAll = () => {
        setIsLoading(true);
        setError(null);
        Promise.all([
            adminGetAllPackages(),
            adminGetAllFacilities(),
            adminGetAllAddons(),
        ])
            .then(([pkgRes, facRes, addonRes]) => {
                setPackages(pkgRes.packages);
                setFacilities(facRes.facilities);
                setAddons(addonRes.addons);
            })
            .catch(setError)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleTogglePackageStatus = async (id: string, currentStatus: boolean) => {
        try {
            await adminUpdatePackage(id, { status: !currentStatus });
            toast.success(t('adminMandapam.packages.updateSuccess'));
            fetchAll();
        } catch (err: any) {
            toast.error(err?.message ?? t('adminMandapam.packages.somethingWentWrong'));
        }
    };

    const handleEditPackage = (pkg: MandapamPackage) => {
        setEditPackage(pkg);
        setIsEditModalOpen(true);
    };

    const handleEditModalSuccess = () => {
        setIsEditModalOpen(false);
        setEditPackage(null);
        fetchAll();
    };

    const handleAddFacility = () => {
        setEditFacility(undefined);
        setIsFacilityModalOpen(true);
    };

    const handleEditFacility = (facility: MandapamFacility) => {
        setEditFacility(facility);
        setIsFacilityModalOpen(true);
    };

    const handleToggleFacilityStatus = async (id: string, currentStatus: boolean) => {
        try {
            await adminUpdateFacility(id, { status: !currentStatus });
            toast.success(t('adminMandapam.facilities.updateSuccess'));
            fetchAll();
        } catch (err: any) {
            toast.error(err?.message ?? t('adminMandapam.facilities.somethingWentWrong'));
        }
    };

    const handleDeleteFacility = async (id: string) => {
        try {
            await adminDeleteFacility(id);
            toast.success(t('adminMandapam.facilities.deleteSuccess'));
            fetchAll();
        } catch (err: any) {
            toast.error(err?.message ?? t('adminMandapam.facilities.somethingWentWrong'));
        }
    };

    const handleFacilityModalSuccess = () => {
        setIsFacilityModalOpen(false);
        setEditFacility(undefined);
        fetchAll();
    };

    const handleAddAddon = () => {
        setEditAddon(undefined);
        setIsAddonModalOpen(true);
    };

    const handleEditAddon = (addon: MandapamAddon) => {
        setEditAddon(addon);
        setIsAddonModalOpen(true);
    };

    const handleToggleAddonStatus = async (id: string, currentStatus: boolean) => {
        try {
            await adminUpdateAddon(id, { status: !currentStatus });
            toast.success(t('adminMandapam.addons.updateSuccess'));
            fetchAll();
        } catch (err: any) {
            toast.error(err?.message ?? t('adminMandapam.addons.somethingWentWrong'));
        }
    };

    const handleDeleteAddon = async (id: string) => {
        try {
            await adminDeleteAddon(id);
            toast.success(t('adminMandapam.addons.deleteSuccess'));
            fetchAll();
        } catch (err: any) {
            toast.error(err?.message ?? t('adminMandapam.addons.somethingWentWrong'));
        }
    };

    const handleAddonModalSuccess = () => {
        setIsAddonModalOpen(false);
        setEditAddon(undefined);
        fetchAll();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-rosewood animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">
                        {t('adminMandapam.packages.loading')}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('adminMandapam.packages.somethingWentWrong')}
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md">
                    {typeof error === 'string' ? error : t('adminMandapam.packages.somethingWentWrong')}
                </p>
                <button
                    onClick={fetchAll}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-rosewood rounded-xl hover:opacity-90 transition-all"
                >
                    {t('adminMandapam.packages.tryAgain')}
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16"
        >
            <section>
                <PackageGrid
                    packages={packages}
                    onEdit={handleEditPackage}
                    onToggleStatus={handleTogglePackageStatus}
                />
            </section>

            <section>
                <SectionHeader
                    title={t('adminMandapam.facilities.title')}
                    description={t('adminMandapam.facilities.desc')}
                    action={{ label: t('adminMandapam.facilities.addNew'), onClick: handleAddFacility }}
                />
                <FacilityGrid
                    facilities={facilities}
                    onEdit={handleEditFacility}
                    onDelete={handleDeleteFacility}
                    onToggleStatus={handleToggleFacilityStatus}
                />
            </section>

            <section>
                <SectionHeader
                    title={t('adminMandapam.addons.title')}
                    description={t('adminMandapam.addons.desc')}
                    action={{ label: t('adminMandapam.addons.addNew'), onClick: handleAddAddon }}
                />
                <AddonGrid
                    addons={addons}
                    onEdit={handleEditAddon}
                    onDelete={handleDeleteAddon}
                    onToggleStatus={handleToggleAddonStatus}
                />
            </section>

            {editPackage && (
                <EditPackageModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setEditPackage(null); }}
                    pkg={editPackage}
                    onSuccess={handleEditModalSuccess}
                />
            )}

            <FacilityModal
                isOpen={isFacilityModalOpen}
                onClose={() => { setIsFacilityModalOpen(false); setEditFacility(undefined); }}
                facility={editFacility}
                onSuccess={handleFacilityModalSuccess}
            />

            <AddonModal
                isOpen={isAddonModalOpen}
                onClose={() => { setIsAddonModalOpen(false); setEditAddon(undefined); }}
                addon={editAddon}
                onSuccess={handleAddonModalSuccess}
            />
        </motion.div>
    );
};

export default PackageManagement;
