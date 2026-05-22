import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Search, UserX, Eye, Check, X, ShieldBan, User as UserIcon, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { RejectionModal } from '@/modals/admin/RejectionModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { TableActionDropdown } from '@/components/ui/table/TableActionDropdown';
import { DataTable, Column } from '@/components/ui/table/DataTable';
import * as adminService from '@/services/adminMatrimony.service';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { useAdminProfilesQuery, useVerifyProfileMutation, useBlockProfileMutation, useSuspendAccountMutation } from '@/hooks/queries/useAdminMatrimony';
import { toast } from 'sonner';

import { Tooltip } from '@/components/ui/Tooltip';
import { getImageUrl } from '@/utils/getImageUrl';

// ═══════════════════════════════════════════════════════════
// ProfileManagement (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const ProfileManagement: React.FC = () => {
    const { language, t, translateError } = useLanguage();
    const { formatDate } = useDateFormatter();
    const navigate = useNavigate();
    const isTamil = language === 'ta';
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 8;
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('All');

    const { data, isLoading } = useAdminProfilesQuery({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        verified: statusFilter !== 'All' ? statusFilter : undefined
    });

    const verifyMutation = useVerifyProfileMutation();
    const blockMutation = useBlockProfileMutation();
    const suspendMutation = useSuspendAccountMutation();

    const [rejectionModal, setRejectionModal] = React.useState<{ open: boolean; profileId: string | null; mode: 'REJECT' | 'BLOCK' | 'SUSPEND' }>({
        open: false,
        profileId: null,
        mode: 'REJECT'
    });

    const handleVerify = (id: string) => {
        verifyMutation.mutate(
            { id, data: { status: 'ACCEPTED' } },
            {
                onSuccess: () => toast.success(t('adminMatrimony.users.verifySuccess')),
                onError: (error: any) => toast.error(translateError(error) || t('adminMatrimony.users.verifyError'))
            }
        );
    };

    const confirmReject = async (reasonEn: string, reasonTa: string) => {
        if (!rejectionModal.profileId) return;
        const handleSuccess = (msg: string) => {
            toast.success(msg);
            setRejectionModal({ open: false, profileId: null, mode: 'REJECT' });
        };
        if (rejectionModal.mode === 'REJECT') {
            verifyMutation.mutate(
                { id: rejectionModal.profileId, data: { status: 'REJECTED', reasonEn, reasonTa } },
                { onSuccess: () => handleSuccess(t('adminMatrimony.users.rejectSuccess')), onError: (error: any) => toast.error(translateError(error) || t('adminMatrimony.common.rejectFailed')) }
            );
        } else if (rejectionModal.mode === 'BLOCK') {
            blockMutation.mutate(
                { id: rejectionModal.profileId, data: { reasonEn, reasonTa } },
                { onSuccess: () => handleSuccess(t('adminMatrimony.users.blockSuccess')), onError: (error: any) => toast.error(translateError(error) || t('adminMatrimony.common.failedFetch')) }
            );
        } else if (rejectionModal.mode === 'SUSPEND') {
            suspendMutation.mutate(
                { id: rejectionModal.profileId, data: { reasonEn, reasonTa } },
                { onSuccess: () => handleSuccess(t('adminMatrimony.users.suspendSuccess')), onError: (error: any) => toast.error(translateError(error) || t('adminMatrimony.users.suspendError')) }
            );
        }
    };

    const handleBlock = (id: string, currentStatus: string) => {
        if (currentStatus === 'INACTIVE') {
            blockMutation.mutate(
                { id, data: { reasonEn: '', reasonTa: '' } },
                { onSuccess: () => toast.success(t('adminMatrimony.users.statusUpdateSuccess')), onError: (error: any) => toast.error(translateError(error) || t('adminMatrimony.users.statusUpdateError')) }
            );
        } else {
            setRejectionModal({ open: true, profileId: id, mode: 'BLOCK' });
        }
    };

    const handleSuspend = (id: string) => {
        setRejectionModal({ open: true, profileId: id, mode: 'SUSPEND' });
    };

    const columns: Column<adminService.AdminManagedProfile>[] = [
        {
            header: t('adminMatrimony.profiles.table.profile') || 'Matrimony Profile',
            render: (profile) => {
                const imageUrl = getImageUrl(profile.photo);
                const displayName = isTamil ? ([profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ')) : ([profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' '));
                return (
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 border border-gold/20 bg-ivory shadow-sm group-hover:scale-105 transition-transform duration-300">
                            {imageUrl ? <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-rosewood bg-gold/10 text-xl font-serif font-bold">{displayName.charAt(0).toUpperCase()}</div>}
                        </div>
                        <div>
                            <div className="font-bold text-rosewood text-sm leading-tight mb-0.5">{displayName}</div>
                            <span className="text-[10px] text-gold font-bold">{profile.regNo}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: t('adminMatrimony.profiles.table.owner') || 'Account Owner',
            render: (profile) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rosewood/5 text-rosewood"><UserIcon size={12} /></div>
                    <div>
                        <div className="text-xs font-bold text-rosewood leading-none mb-1">{isTamil ? [profile.owner.firstNameTa, profile.owner.lastNameTa].filter(Boolean).join(' ') : [profile.owner.firstNameEn, profile.owner.lastNameEn].filter(Boolean).join(' ')}</div>
                        <span className="text-[9px] text-slate-400 font-bold">ID: {profile.owner.id}</span>
                    </div>
                </div>
            )
        },
        {
            header: t('adminMatrimony.profiles.table.created') || 'Created',
            render: (profile) => <div className="text-xs font-bold text-slate-500 tabular-nums">{formatDate(profile.createdAt)}</div>
        },
        {
            header: t('adminMatrimony.profiles.table.status') || 'Verification',
            render: (profile) => <StatusBadge status={profile.adminVerified.toLowerCase()} minimal />
        },
        {
            header: t('adminMatrimony.common.actions') || 'Actions',
            headerClassName: 'w-20 text-center',
            className: 'text-center',
            render: (profile) => (
                <div className="flex justify-center">
                    <Tooltip content={t('adminMatrimony.verification.viewProfile') || 'View Profile'}>
                        <button 
                            onClick={() => navigate(`/admin/matrimony/profiles/${profile.id}`)}
                            className="p-2.5 rounded-xl bg-gold/5 text-gold hover:bg-rosewood hover:text-white transition-all duration-300 shadow-sm border border-gold/10 hover:border-rosewood"
                        >
                            <Eye size={18} strokeWidth={2.5} />
                        </button>
                    </Tooltip>
                </div>
            )
        }
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1500px] mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder={t('common:search')} />
                </div>
                <TableActionDropdown variant="filter" triggerLabel={statusFilter === 'All' ? t('adminMatrimony.common.all') : t(`adminMatrimony.common.${statusFilter.toLowerCase()}`)} triggerIcon={Filter} items={[
                    { label: t('adminMatrimony.common.all') || 'All Statuses', icon: Filter, onClick: () => { setStatusFilter('All'); setCurrentPage(1); } },
                    { label: t('adminMatrimony.common.pending') || 'Pending Review', icon: Search, onClick: () => { setStatusFilter('PENDING'); setCurrentPage(1); } },
                    { label: t('adminMatrimony.common.approved') || 'Approved', icon: Check, onClick: () => { setStatusFilter('ACCEPTED'); setCurrentPage(1); } },
                    { label: t('adminMatrimony.common.rejected') || 'Rejected', icon: X, onClick: () => { setStatusFilter('REJECTED'); setCurrentPage(1); } }
                ]} />
            </div>
            <DataTable columns={columns} data={data?.profiles || []} loading={isLoading} pagination={{ currentPage, totalPages: data?.meta?.totalPages || 1, totalItems: data?.meta?.total || 0, itemsPerPage, onPageChange: setCurrentPage }} emptyState={{ icon: Eye, title: t('adminMatrimony.users.noProfilesFound') }} />
            <RejectionModal isOpen={rejectionModal.open} onClose={() => setRejectionModal({ open: false, profileId: null, mode: 'REJECT' })} onConfirm={confirmReject} title={rejectionModal.mode === 'REJECT' ? t('adminMatrimony.common.rejectionReason') : rejectionModal.mode === 'BLOCK' ? t('adminMatrimony.common.blockingReason') : t('adminMatrimony.common.suspensionReason')} placeholder={t('adminMatrimony.common.enterReason') || "Enter the reason..."} confirmLabel={rejectionModal.mode === 'REJECT' ? t('adminMatrimony.common.reject') : t('adminMatrimony.common.confirm')} cancelLabel={t('adminMatrimony.common.cancel')} />
        </motion.div>
    );
};

export default ProfileManagement;
