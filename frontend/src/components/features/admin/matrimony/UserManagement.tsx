import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, Phone, TrendingUp, UserMinus, UserCheck, Search, UserX, Filter, Users as UsersIcon } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { TableActionDropdown } from '@/components/ui/table/TableActionDropdown';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { RejectionModal } from '@/modals/admin/RejectionModal';
import { DataTable, Column } from '@/components/ui/table/DataTable';
import { fetchAdminAccounts, suspendAccount, revokeAccount } from '@/api/admin-accounts.api';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import type { AdminAccount } from '@/types/admin-types';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════
// UserManagement (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const UserManagement: React.FC = () => {
    const { t, language, translateError } = useLanguage();
    const { formatDate } = useDateFormatter();
    const isTamil = language === 'ta';
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 8;
    const [searchQuery, setSearchQuery] = React.useState('');

    const [data, setData] = React.useState<any>({ accounts: [], meta: { total: 0, totalPages: 1, page: 1, limit: itemsPerPage } });
    const [isLoading, setIsLoading] = React.useState(true);
    React.useEffect(() => { setIsLoading(true); fetchAdminAccounts({ page: currentPage, search: searchQuery }).then(setData).finally(() => setIsLoading(false)); }, [currentPage, searchQuery]);

    const [suspensionModal, setSuspensionModal] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });

    const handleSuspend = (reasonEn: string, reasonTa: string) => {
        if (!suspensionModal.userId) return;
        suspendAccount(suspensionModal.userId, reasonEn, reasonTa).then(
            () => { toast.success(t('adminMatrimony.users.suspendSuccess')); setSuspensionModal({ open: false, userId: null }); }
        ).catch(
            (error: any) => toast.error(translateError(error) || t('adminMatrimony.users.suspendError'))
        );
    };

    const handleRevoke = (id: string) => {
        revokeAccount(id).then(
            () => toast.success(t('adminMatrimony.users.revokeSuccess'))
        ).catch(
            (error: any) => toast.error(translateError(error) || t('adminMatrimony.users.revokeError'))
        );
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
            headerClassName: 'w-20 text-center',
            className: 'text-center',
            render: (user) => {
                return (
                    <TableActionDropdown items={[
                        { label: user.accountStatus === 'ACTIVE' ? t('adminMatrimony.common.suspend') : t('adminMatrimony.common.revoke'), icon: user.accountStatus === 'ACTIVE' ? UserMinus : UserCheck, onClick: () => user.accountStatus === 'ACTIVE' ? setSuspensionModal({ open: true, userId: user.id }) : handleRevoke(user.id) }
                    ]} />
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
            <RejectionModal isOpen={suspensionModal.open} onClose={() => setSuspensionModal({ open: false, userId: null })} onConfirm={handleSuspend} title={t('adminMatrimony.common.suspensionReason')} description={t('adminMatrimony.users.suspendWarning') || "This will deactivate the user account and hide all their profiles globally."} confirmLabel={t('adminMatrimony.common.confirm')} cancelLabel={t('adminMatrimony.common.cancel')} placeholder={t('adminMatrimony.common.enterReason')} />
        </motion.div>
    );
};

export default UserManagement;
