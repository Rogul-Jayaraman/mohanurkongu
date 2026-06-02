import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Search, Eye, Check, X, ShieldBan, User as UserIcon, Filter, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { RejectionModal } from '@/modals/admin/RejectionModal';
import { ConfirmationModal } from '@/modals/admin/ConfirmationModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { TableActionDropdown } from '@/components/ui/table/TableActionDropdown';
import { DataTable, Column } from '@/components/ui/table/DataTable';
// hooks used for API calls instead of direct imports
import { useDateFormatter } from '@/hooks/useDateFormatter';
import type { AdminManagedProfile } from '@/types/admin-types';
import { toast } from 'sonner';
import { useAdminProfilesQuery } from '@/queries/useProfileQueries';
import {
  useApproveProfileMutation,
  useRejectProfileMutation,
  useArchiveProfileMutation,
  useRestoreProfileMutation,
  useDeleteProfileMutation,
} from '@/queries/useAdminMutations';

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

    const adminProfilesQuery = useAdminProfilesQuery({
      page: currentPage,
      search: searchQuery,
      status: statusFilter,
      limit: itemsPerPage,
    });
    const data: any = (adminProfilesQuery.data as any) ?? { profiles: [], meta: { total: 0, totalPages: 1, page: 1, limit: itemsPerPage } };
    const isLoading = adminProfilesQuery.isPending;

    const approveMutation = useApproveProfileMutation();
    const rejectMutation = useRejectProfileMutation();
    const archiveMutation = useArchiveProfileMutation();
    const restoreMutation = useRestoreProfileMutation();
    const deleteMutation = useDeleteProfileMutation();

    const [rejectionModal, setRejectionModal] = React.useState<{ open: boolean; profileId: string | null; mode: 'REJECT' | 'ARCHIVE' }>({
        open: false,
        profileId: null,
        mode: 'REJECT'
    });

    const [deleteModal, setDeleteModal] = React.useState<{ open: boolean; profileId: string | null }>({
        open: false,
        profileId: null,
    });

    const [restoreModal, setRestoreModal] = React.useState<{ open: boolean; profileId: string | null }>({
        open: false,
        profileId: null,
    });

    const handleVerify = (id: string) => {
        approveMutation.mutate(id, {
            onSuccess: () => toast.success(t('adminMatrimony.users.verifySuccess')),
        });
    };

    const confirmReject = async (reasonEn: string, reasonTa: string) => {
        if (!rejectionModal.profileId) return;
        const profileId = rejectionModal.profileId;
        if (rejectionModal.mode === 'REJECT') {
            rejectMutation.mutate(
                { id: profileId, reasonEn, reasonTa },
                {
                    onSuccess: () => {
                        toast.success(t('adminMatrimony.users.rejectSuccess'));
                        setRejectionModal({ open: false, profileId: null, mode: 'REJECT' });
                    },
                },
            );
        } else if (rejectionModal.mode === 'ARCHIVE') {
            archiveMutation.mutate(
                { id: profileId, reasonEn, reasonTa },
                {
                    onSuccess: () => {
                        toast.success(t('adminMatrimony.users.blockSuccess') || 'Profile archived');
                        setRejectionModal({ open: false, profileId: null, mode: 'REJECT' });
                    },
                },
            );
        }
    };

    const handleArchive = (id: string, currentStatus: string) => {
        if (currentStatus === 'ARCHIVED') {
            setRestoreModal({ open: true, profileId: id });
        } else if (currentStatus === 'ACTIVE') {
            setRejectionModal({ open: true, profileId: id, mode: 'ARCHIVE' });
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ open: true, profileId: id });
    };

    const handleConfirmDelete = () => {
        if (!deleteModal.profileId) return;
        const profileId = deleteModal.profileId;
        deleteMutation.mutate(profileId, {
            onSuccess: () => {
                setDeleteModal({ open: false, profileId: null });
            },
        });
    };

    const handleConfirmRestore = () => {
        if (!restoreModal.profileId) return;
        const profileId = restoreModal.profileId;
        restoreMutation.mutate(profileId, {
            onSuccess: () => {
                setRestoreModal({ open: false, profileId: null });
            },
        });
    };

    const columns: Column<AdminManagedProfile>[] = [
        {
            header: t('adminMatrimony.profiles.table.profile') || 'Matrimony Profile',
            render: (profile) => {
                const photoValue = profile.profilePhoto || profile.photo || (profile.photos && profile.photos[0]);
                const rawUrl = typeof photoValue === 'string' ? photoValue : photoValue?.url || null;
                const imageUrl = getImageUrl(rawUrl);
                const displayName = isTamil ? ([profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ')) : ([profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' '));
                return (
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 border border-gold/20 bg-ivory shadow-sm group-hover:scale-105 transition-transform duration-300">
                            {imageUrl ? <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" loading="lazy" decoding="async" /> : <div className="w-full h-full flex items-center justify-center text-rosewood bg-gold/10 text-xl font-serif font-bold">{displayName.charAt(0).toUpperCase()}</div>}
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
            render: (profile) => <StatusBadge status={(profile.status || '').toLowerCase()} minimal />
        },
        {
            header: t('adminMatrimony.common.actions') || 'Actions',
            headerClassName: 'w-36 text-center',
            className: 'text-center',
            render: (profile) => (
                <div className="flex justify-center gap-1.5">
                    <Tooltip content={t('adminMatrimony.verification.viewProfile') || 'View Profile'}>
                        <button 
                            onClick={() => navigate(`/admin/matrimony/profiles/${profile.id}`)}
                            className="p-2.5 rounded-xl bg-gold/5 text-gold hover:bg-rosewood hover:text-white transition-all duration-300 shadow-sm border border-gold/10 hover:border-rosewood"
                        >
                            <Eye size={18} strokeWidth={2.5} />
                        </button>
                    </Tooltip>
                    {profile.status === 'ACTIVE' && (
                        <Tooltip content={t('adminMatrimony.common.blockingReason') || 'Archive'}>
                            <button 
                                onClick={() => handleArchive(profile.id, profile.status)}
                                className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-800 transition-all duration-300 shadow-sm border border-amber-200"
                            >
                                <ShieldBan size={18} strokeWidth={2.5} />
                            </button>
                        </Tooltip>
                    )}
                    {profile.status === 'ARCHIVED' && (
                        <Tooltip content={t('adminMatrimony.common.restore') || 'Restore'}>
                            <button 
                                onClick={() => handleArchive(profile.id, profile.status)}
                                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 transition-all duration-300 shadow-sm border border-emerald-200"
                            >
                                <Eye size={18} strokeWidth={2.5} />
                            </button>
                        </Tooltip>
                    )}
                    {profile.status !== 'DRAFT' && profile.status !== 'DELETED' && (
                        <Tooltip content={t('adminMatrimony.common.delete') || 'Delete'}>
                            <button 
                                onClick={() => handleDeleteClick(profile.id)}
                                className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-all duration-300 shadow-sm border border-red-200"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                        </Tooltip>
                    )}
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
                    { label: t('adminMatrimony.common.approved') || 'Active', icon: Check, onClick: () => { setStatusFilter('ACTIVE'); setCurrentPage(1); } },
                    { label: t('adminMatrimony.common.rejected') || 'Rejected', icon: X, onClick: () => { setStatusFilter('REJECTED'); setCurrentPage(1); } }
                ]} />
            </div>
            <DataTable columns={columns} data={data?.profiles || []} loading={isLoading} pagination={{ currentPage, totalPages: data?.meta?.totalPages || 1, totalItems: data?.meta?.total || 0, itemsPerPage, onPageChange: setCurrentPage }} emptyState={{ icon: Eye, title: t('adminMatrimony.users.noProfilesFound') }} />
            <RejectionModal isOpen={rejectionModal.open} onClose={() => setRejectionModal({ open: false, profileId: null, mode: 'REJECT' })} onConfirm={confirmReject} title={rejectionModal.mode === 'REJECT' ? t('adminMatrimony.common.rejectionReason') : t('adminMatrimony.common.blockingReason') || 'Archive Reason'} placeholder={t('adminMatrimony.common.enterReason') || "Enter the reason..."} confirmLabel={rejectionModal.mode === 'REJECT' ? t('adminMatrimony.common.reject') : t('adminMatrimony.common.confirm')} cancelLabel={t('adminMatrimony.common.cancel')} />
            <ConfirmationModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, profileId: null })}
                onConfirm={handleConfirmDelete}
                title={t('adminMatrimony.common.deleteProfile') || 'Delete Profile'}
                message={t('adminMatrimony.users.deleteWarning') || 'Are you sure you want to delete this profile? This action cannot be undone. All associated data will be permanently removed.'}
                confirmText={t('adminMatrimony.common.delete') || 'Delete'}
                variant="danger"
            />
            <ConfirmationModal
                isOpen={restoreModal.open}
                onClose={() => setRestoreModal({ open: false, profileId: null })}
                onConfirm={handleConfirmRestore}
                title={t('adminMatrimony.common.restoreProfile') || 'Restore Profile'}
                message={t('adminMatrimony.users.restoreWarning') || 'Are you sure you want to restore this profile? It will become visible and matchable again.'}
                confirmText={t('adminMatrimony.common.restore') || 'Restore'}
                variant="warning"
            />
        </motion.div>
    );
};

export default ProfileManagement;
