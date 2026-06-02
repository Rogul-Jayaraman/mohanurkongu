import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAdminPackages, useFacilities, useAddons } from '@/queries/useMandapamQueries';
import { useUpdatePackage, useDeletePackageFunction, useUpdateFacility, useDeleteFacility, useUpdateAddon, useDeleteAddon } from '@/queries/useMandapamMutations';
import { PackageGrid } from './PackageGrid';
import { EditPackageModal } from './EditPackageModal';
import { FacilityGrid } from '@/components/features/admin/mandapam/facilities/FacilityGrid';
import { FacilityModal } from '@/components/features/admin/mandapam/facilities/FacilityModal';
import { AddonGrid } from '@/components/features/admin/mandapam/addons/AddonGrid';
import { AddonModal } from '@/components/features/admin/mandapam/addons/AddonModal';
import type { MandapamPackage, MandapamFacility, MandapamAddon } from '@/types/mandapam';

const PackageManagement: React.FC = () => {
    const { t } = useLanguage();

    const { data: pkgData, isLoading, error, refetch } = useAdminPackages();
    const { data: facData } = useFacilities();
    const { data: addonData } = useAddons();
    const deleteFn = useDeletePackageFunction();
    const updateFac = useUpdateFacility();
    const deleteFac = useDeleteFacility();
    const updateAddon = useUpdateAddon();
    const deleteAddon = useDeleteAddon();

    const packages = pkgData?.packages ?? [];
    const facilities = facData?.items ?? [];
    const addons = addonData?.items ?? [];

    const [editPackage, setEditPackage] = useState<MandapamPackage | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [editFacility, setEditFacility] = useState<MandapamFacility | undefined>(undefined);
    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);

    const [editAddon, setEditAddon] = useState<MandapamAddon | undefined>(undefined);
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

    const updatePkg = useUpdatePackage();

    const handleTogglePackageStatus = async (id: string, currentStatus: boolean) => {
        await updatePkg.mutateAsync({ id, dto: { status: !currentStatus } });
    };

    const handleEditPackage = (pkg: MandapamPackage) => {
        setEditPackage(pkg);
        setIsEditModalOpen(true);
    };

    const handleEditModalSuccess = () => {
        setIsEditModalOpen(false);
        setEditPackage(null);
        refetch();
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
        await updateFac.mutateAsync({ id, dto: { status: !currentStatus } });
    };

    const handleDeleteFacility = async (id: string) => {
        await deleteFac.mutateAsync(id);
    };

    const handleFacilityModalSuccess = () => {
        setIsFacilityModalOpen(false);
        setEditFacility(undefined);
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
        await updateAddon.mutateAsync({ id, dto: { status: !currentStatus } });
    };

    const handleDeleteAddon = async (id: string) => {
        await deleteAddon.mutateAsync(id);
    };

    const handleAddonModalSuccess = () => {
        setIsAddonModalOpen(false);
        setEditAddon(undefined);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-rosewood animate-spin" />
                    <p className="text-sm text-rosewood/50 font-medium">
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
                <h3 className="text-lg font-bold text-rosewood mb-2">
                    {t('adminMandapam.packages.somethingWentWrong')}
                </h3>
                <p className="text-sm text-rosewood/50 mb-6 max-w-md">
                    {(error as Error)?.message || t('adminMandapam.packages.somethingWentWrong')}
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-rosewood rounded-xl hover:bg-rosewood-dark transition-all"
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

            <section className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-10 rounded-full bg-linear-to-b from-rosewood to-rosewood/40" />
                        <div>
                            <h2 className="text-lg font-bold text-rosewood">{t('adminMandapam.facilities.title')}</h2>
                            <p className="text-xs text-rosewood/40 mt-0.5">{t('adminMandapam.facilities.desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddFacility}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rosewood text-white rounded-xl text-xs font-bold hover:bg-rosewood-dark transition-all shrink-0"
                    >
                        <Plus size={15} />
                        {t('adminMandapam.facilities.addNew')}
                    </button>
                </div>
                <FacilityGrid
                    facilities={facilities}
                    onEdit={handleEditFacility}
                    onDelete={handleDeleteFacility}
                    onToggleStatus={handleToggleFacilityStatus}
                />
            </section>

            <section className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-10 rounded-full bg-linear-to-b from-gold to-gold/40" />
                        <div>
                            <h2 className="text-lg font-bold text-rosewood">{t('adminMandapam.addons.title')}</h2>
                            <p className="text-xs text-rosewood/40 mt-0.5">{t('adminMandapam.addons.desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddAddon}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rosewood text-white rounded-xl text-xs font-bold hover:bg-rosewood-dark transition-all shrink-0"
                    >
                        <Plus size={15} />
                        {t('adminMandapam.addons.addNew')}
                    </button>
                </div>
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
