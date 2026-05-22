import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { SearchAndSort } from '@/components/ui/table/SearchAndSort';
import { AdminProfileCard } from '@/components/features/admin/matrimony/ProfileCard';
import { RejectionModal } from '@/modals/admin/RejectionModal';
import * as adminService from '@/services/adminMatrimony.service';
import { toast } from 'sonner';
import { useAdminVerificationQuery, useVerifyProfileMutation } from '@/hooks/queries/useAdminMatrimony';
import { Loader2, UserX, Shield } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// VerificationSkeleton
// ═══════════════════════════════════════════════════════════
const VerificationSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-4xl bg-white/40 border border-gold-soft/10 animate-pulse flex gap-5">
                <div className="w-40 md:w-44 aspect-3/4 rounded-2xl bg-gray-200/50 shrink-0" />
                <div className="flex-1 space-y-4 py-2">
                    <div className="h-6 w-2/3 bg-gray-200/50 rounded-lg" />
                    <div className="space-y-2">{[1, 2, 3, 4, 5].map(j => <div key={j} className="h-3 w-full bg-gray-100/50 rounded" />)}</div>
                </div>
            </div>
        ))}
    </div>
);

// ═══════════════════════════════════════════════════════════
// EmptyState
// ═══════════════════════════════════════════════════════════
const EmptyState: React.FC<{ isTamil: boolean; onReset: () => void }> = ({ isTamil, onReset }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/40 backdrop-blur-xl border border-gold-soft/20 rounded-[3rem] p-24 text-center group">
        <div className="w-24 h-24 bg-gold-soft/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500"><UserX className="w-12 h-12 text-gold-soft/40" /></div>
        <h3 className="text-2xl font-serif font-bold text-rosewood/60 mb-2">{isTamil ? 'சுயவிவரங்கள் இல்லை' : 'No Profiles'}</h3>
        <p className="text-slate-400 font-medium max-w-xs mx-auto">{isTamil ? 'தற்போது சரிபார்க்க எந்த சுயவிவரங்களும் இல்லை. பின்னர் மீண்டும் சரிபார்க்கவும்.' : 'There are no profiles waiting for verification at the moment. Please check back later.'}</p>
        <button onClick={onReset} className="mt-8 px-8 py-3 rounded-xl border border-gold-soft/30 text-rosewood font-black text-xs uppercase tracking-widest hover:bg-gold-soft/10 transition-all">{isTamil ? 'மீட்டமை' : 'Reset Filters'}</button>
    </motion.div>
);

// ═══════════════════════════════════════════════════════════
// ProfileVerification (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }, exit: { opacity: 0, scale: 0.95, x: -20, transition: { duration: 0.2 } } };

const ProfileVerification: React.FC = () => {
    const { t, language, translateError } = useLanguage();
    const isTamil = language === 'ta';
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [dateSort, setDateSort] = React.useState<'asc' | 'desc' | null>('desc');
    const [nameSort, setNameSort] = React.useState<'asc' | 'desc' | null>(null);
    const [rejectionModal, setRejectionModal] = React.useState<{ open: boolean; profileId: string | null }>({ open: false, profileId: null });

    const { data: qData, isLoading } = useAdminVerificationQuery({ page: 1, limit: 100, search: searchQuery });
    const verifyMutation = useVerifyProfileMutation();

    const handleAccept = (id: string) => {
        verifyMutation.mutate(
            { id, data: { status: 'ACCEPTED' } },
            { onSuccess: () => toast.success(t('adminMatrimony.users.verifySuccess')), onError: (error: any) => toast.error(translateError(error) || t('adminMatrimony.users.verifyError')) }
        );
    };

    const handleRejectClick = (id: string) => setRejectionModal({ open: true, profileId: id });

    const handleConfirmReject = (reasonEn: string, reasonTa: string) => {
        if (!rejectionModal.profileId) return;
        verifyMutation.mutate(
            { id: rejectionModal.profileId, data: { status: 'REJECTED', reasonEn, reasonTa } },
            { onSuccess: () => { toast.success(t('adminMatrimony.users.rejectSuccess')); setRejectionModal({ open: false, profileId: null }); }, onError: (error: any) => toast.error(translateError(error) || t('adminMatrimony.common.rejectFailed')) }
        );
    };

    const handleReset = () => { setDateSort('desc'); setNameSort(null); setSearchQuery(''); };

    const sortedAndFiltered = (qData?.profiles || [])
        .filter((p: adminService.AdminManagedProfile) => {
            const name = isTamil ? ([p.firstNameTa, p.lastNameTa].filter(Boolean).join(' ') || [p.firstNameEn, p.lastNameEn].filter(Boolean).join(' ')) : ([p.firstNameEn, p.lastNameEn].filter(Boolean).join(' '));
            const searchLower = searchQuery.toLowerCase().trim();
            if (!searchLower) return true;
            
            return (
                name.toLowerCase().includes(searchLower) || 
                p.regNo.toLowerCase().includes(searchLower)
            );
        })
        .sort((a: adminService.AdminManagedProfile, b: adminService.AdminManagedProfile) => {
            if (nameSort) {
                const nameA = isTamil ? ([a.firstNameTa, a.lastNameTa].filter(Boolean).join(' ') || [a.firstNameEn, a.lastNameEn].filter(Boolean).join(' ')) : ([a.firstNameEn, a.lastNameEn].filter(Boolean).join(' '));
                const nameB = isTamil ? ([b.firstNameTa, b.lastNameTa].filter(Boolean).join(' ') || [b.firstNameEn, b.lastNameEn].filter(Boolean).join(' ')) : ([b.firstNameEn, b.lastNameEn].filter(Boolean).join(' '));
                const nameCompare = nameA.localeCompare(nameB);
                return nameSort === 'asc' ? nameCompare : -nameCompare;
            }
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
        });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-[1500px] mx-auto">
            <SearchAndSort 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
                dateSort={dateSort} 
                onDateSortToggle={() => { setDateSort(dateSort === 'desc' ? 'asc' : 'desc'); setNameSort(null); }} 
                nameSort={nameSort} 
                onNameSortToggle={() => { setNameSort(nameSort === 'asc' ? 'desc' : 'asc'); setDateSort(null); }} 
                onReset={handleReset}
                placeholder={t('common:search')}
            />
            {isLoading ? (
                <VerificationSkeleton />
            ) : sortedAndFiltered.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {sortedAndFiltered.map((profile) => (
                            <motion.div key={profile.id} layout variants={itemVariants}>
                                <AdminProfileCard profile={{ ...profile, submittedAt: profile.createdAt } as any} adminActions={{ onAccept: handleAccept, onReject: (id) => handleRejectClick(id), onView: (id) => navigate(`/admin/matrimony/profiles/${id}`) }} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <EmptyState isTamil={isTamil} onReset={handleReset} />
            )}
            <RejectionModal isOpen={rejectionModal.open} onClose={() => setRejectionModal({ open: false, profileId: null })} onConfirm={handleConfirmReject} title={t('adminMatrimony.common.rejectionReason')} placeholder={t('adminMatrimony.common.enterReason')} confirmLabel={t('adminMatrimony.common.reject')} cancelLabel={t('adminMatrimony.common.cancel')} />
        </motion.div>
    );
};

export default ProfileVerification;
