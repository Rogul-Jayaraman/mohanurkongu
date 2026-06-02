import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Eye, Phone, Search, UserX, Users as UsersIcon, XCircle, Crown, UserMinus, UserCheck } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { Tooltip } from '@/components/ui/Tooltip';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { DataTable, Column } from '@/components/ui/table/DataTable';
import { fetchAdminAccountDetail } from '@/api/admin-accounts.api';
import { ConfirmationModal } from '@/components/modals/admin/ConfirmationModal';
import { RejectionModal } from '@/components/modals/admin/RejectionModal';
import CancelSubscriptionModal from './CancelSubscriptionModal';
import AssignPlanModal from './AssignPlanModal';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import type { AdminAccount } from '@/types/admin-types';
import { toast } from 'sonner';
import { useAdminAccountsQuery, useSuspendAccountMutation, useRestoreAccountMutation, useAdminCancelSubscriptionMutation } from '@/queries/useAdminAccountQueries';

// ═══════════════════════════════════════════════════════════
// UserManagement (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { formatDate } = useDateFormatter();
    const isTamil = language === 'ta';
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 8;
    const [searchQuery, setSearchQuery] = React.useState('');

    const accountsQuery = useAdminAccountsQuery({ page: currentPage, search: searchQuery });
    const data = accountsQuery.data || { accounts: [], meta: { total: 0, totalPages: 1, page: 1, limit: itemsPerPage } };
    const isLoading = accountsQuery.isPending;
    const cancelMut = useAdminCancelSubscriptionMutation();
    const suspendMut = useSuspendAccountMutation();
    const restoreMut = useRestoreAccountMutation();

    const [cancelTarget, setCancelTarget] = React.useState<{ userId: string; planName: string; revertableName: string | null } | null>(null);
    const [suspendTarget, setSuspendTarget] = React.useState<string | null>(null);
    const [restoreTarget, setRestoreTarget] = React.useState<string | null>(null);
    const [planTarget, setPlanTarget] = React.useState<{ id: string; planCode: string; plans: any[] } | null>(null);
    const [planLoading, setPlanLoading] = React.useState(false);

    const handlePlanClick = async (userId: string) => {
        setPlanLoading(true);
        try {
            const detail = await fetchAdminAccountDetail(userId);
            setPlanTarget({ id: userId, planCode: detail.subscription?.snapshotPlanCode || 'BRONZE', plans: detail.availablePlans || [] });
        } catch {
            toast.error('Failed to load plan info');
        } finally {
            setPlanLoading(false);
        }
    };

    const handleCancelClick = async (userId: string) => {
        try {
            const detail = await fetchAdminAccountDetail(userId);
            setCancelTarget({
                userId,
                planName: detail.subscription?.snapshotPlanName || 'BRONZE',
                revertableName: detail.revertableSubscription?.snapshotPlanName || null,
            });
        } catch {
            toast.error(t('adminMatrimony.users.loadError') || 'Failed to load subscription info');
        }
    };

    const handleCancelConfirm = async (action: 'cancel' | 'revert') => {
        if (!cancelTarget) return;
        try {
            await cancelMut.mutateAsync({ id: cancelTarget.userId, action });
            toast.success(action === 'cancel'
                ? (isTamil ? 'இலவச திட்டத்திற்கு மாற்றப்பட்டது' : 'Downgraded to BRONZE plan')
                : (isTamil ? 'முந்தைய திட்டத்திற்கு மாற்றப்பட்டது' : 'Reverted to previous plan'));
            setCancelTarget(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to cancel subscription');
        }
    };

    const handleSuspend = async (reasonEn: string, reasonTa: string) => {
        if (!suspendTarget) return;
        try {
            await suspendMut.mutateAsync({ id: suspendTarget, reasonEn, reasonTa });
            setSuspendTarget(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to suspend');
        }
    };

    const handleRestore = async () => {
        if (!restoreTarget) return;
        try {
            await restoreMut.mutateAsync(restoreTarget);
            setRestoreTarget(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to restore');
        }
    };

    const columns: Column<AdminAccount>[] = [
        {
            header: t('adminMatrimony.users.table.user') || 'User Profile',
            render: (user) => (
                <div>
                    <div className="font-bold text-rosewood/80 text-sm">{isTamil ? [user.firstNameTa, user.lastNameTa].filter(Boolean).join(' ') : [user.firstNameEn, user.lastNameEn].filter(Boolean).join(' ')}</div>
                    <div className="text-[10px] text-sage font-bold">{user.customId}</div>
                </div>
            )
        },
        {
            header: t('adminMatrimony.users.table.contact') || 'Contact',
            render: (user) => (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone size={12} className="text-gold" />
                    <span>{user.phone}</span>
                </div>
            )
        },
        {
            header: t('adminMatrimony.users.table.profiles') || 'Profiles',
            render: (user) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-ivory flex items-center justify-center border border-gold/10 text-rosewood"><UsersIcon size={14} /></div>
                    <div>
                        <div className="text-xs font-bold text-rosewood">{user.profileCount}</div>
                        <div className="text-[9px] text-slate-400 font-bold">{t('adminMatrimony.users.table.count') || 'Profiles'}</div>
                    </div>
                </div>
            )
        },
        {
            header: t('adminMatrimony.users.table.joined') || 'Joined',
            render: (user) => <div className="text-xs font-bold text-slate-600 tabular-nums">{formatDate(user.joinedDate)}</div>
        },
        {
            header: t('adminMatrimony.users.table.accStatus') || 'Account Status',
            render: (user) => <StatusBadge status={user.accountStatus as any} minimal />
        },
        {
            header: t('adminMatrimony.common.actions') || 'Actions',
            headerClassName: 'w-36 text-center',
            className: 'text-center',
            render: (user) => {
                const isSuspended = user.accountStatus === 'SUSPENDED';
                return (
                    <div className="flex items-center justify-center gap-1">
                        <Tooltip content={t('adminMatrimony:accountDetail.viewDetails') || 'View Details'}>
                            <button
                                onClick={() => navigate(`/admin/matrimony/account/${user.id}`)}
                                className="p-2 rounded-lg bg-gold/5 text-gold hover:bg-rosewood hover:text-white transition-all duration-300 shadow-sm border border-gold/10 hover:border-rosewood"
                            >
                                <Eye size={16} />
                            </button>
                        </Tooltip>
                        {isSuspended ? (
                            <>
                                <Tooltip content={isTamil ? 'சந்தாவை ரத்துசெய்' : 'Cancel Subscription'}>
                                    <button
                                        onClick={() => handleCancelClick(user.id)}
                                        className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all duration-300 shadow-sm border border-red-200 hover:border-red-300"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </Tooltip>
                                <Tooltip content={isTamil ? 'கணக்கை மீட்டெடுக்கவும்' : 'Restore Account'}>
                                    <button
                                        onClick={() => setRestoreTarget(user.id)}
                                        className="p-2 rounded-lg bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-300 shadow-sm border border-emerald-200 hover:border-emerald-300"
                                    >
                                        <UserCheck size={16} />
                                    </button>
                                </Tooltip>
                            </>
                        ) : (
                            <>
                                <Tooltip content={isTamil ? 'திட்டத்தை மேம்படுத்து' : 'Upgrade Plan'}>
                                    <button
                                        onClick={() => handlePlanClick(user.id)}
                                        disabled={planLoading}
                                        className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-50 transition-all duration-300 shadow-sm border border-amber-200 hover:border-amber-300"
                                    >
                                        <Crown size={16} />
                                    </button>
                                </Tooltip>
                                <Tooltip content={isTamil ? 'கணக்கை இடைநிறுத்து' : 'Suspend Account'}>
                                    <button
                                        onClick={() => setSuspendTarget(user.id)}
                                        className="p-2 rounded-lg bg-rosewood/5 text-rosewood/60 hover:bg-rosewood hover:text-white transition-all duration-300 shadow-sm border border-rosewood/10 hover:border-rosewood"
                                    >
                                        <UserMinus size={16} />
                                    </button>
                                </Tooltip>
                            </>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1500px] mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder={t('common:search')} />
                </div>
            </div>
            <DataTable columns={columns} data={data?.accounts || []} loading={isLoading} pagination={{ currentPage, totalPages: data?.meta?.totalPages || 1, totalItems: data?.meta?.total || 0, itemsPerPage, onPageChange: setCurrentPage }} emptyState={{ icon: UserX, title: t('adminMatrimony.users.noAccountsFound') }} />
            <CancelSubscriptionModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleCancelConfirm}
                currentPlanName={cancelTarget?.planName || '—'}
                revertablePlanName={cancelTarget?.revertableName}
            />
            <RejectionModal
                isOpen={!!suspendTarget}
                onClose={() => setSuspendTarget(null)}
                onConfirm={handleSuspend}
                title={isTamil ? 'கணக்கை இடைநிறுத்துவதற்கான காரணம்' : 'Suspension Reason'}
                description={isTamil
                    ? 'இது பயனர் கணக்கை முடக்கி, அவர்களின் அனைத்து சுயவிவரங்களையும் உலகளவில் மறைக்கும்'
                    : 'This will deactivate the user account and hide all their profiles globally'}
            />
            <ConfirmationModal
                isOpen={!!restoreTarget}
                onClose={() => setRestoreTarget(null)}
                onConfirm={handleRestore}
                title={isTamil ? 'கணக்கை மீட்டெடுக்கவும்' : 'Restore Account'}
                message={isTamil
                    ? 'இந்தக் கணக்கை மீட்டெடுப்பது அதை மீண்டும் செயலில் உள்ள நிலைக்கு மாற்றும் மற்றும் அனைத்து சுயவிவரங்களையும் மீண்டும் தெரியும்படி செய்யும். தொடர வேண்டுமா?'
                    : 'Restoring this account will reactivate it and make all profiles visible again. Continue?'}
                variant="warning"
                confirmText={isTamil ? 'ஆம், மீட்டெடுக்கவும்' : 'Yes, Restore'}
            />
            <AssignPlanModal
                accountId={planTarget?.id || ''}
                currentPlanCode={planTarget?.planCode || 'BRONZE'}
                availablePlans={planTarget?.plans || []}
                isOpen={!!planTarget}
                onClose={() => setPlanTarget(null)}
                onAssigned={() => {
                    setPlanTarget(null);
                    accountsQuery.refetch();
                }}
            />
        </motion.div>
    );
};

export default UserManagement;
