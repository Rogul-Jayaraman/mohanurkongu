import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { SearchAndSort } from '@/components/ui/table/SearchAndSort';
import { AdminProfileCard } from '@/components/features/admin/matrimony/ProfileCard';
import { useVerificationQueueQuery, useVerificationStatsQuery } from '@/queries/useProfileQueries';
import AuditPanel from './AuditPanel';
import { toast } from 'sonner';
import type { AdminManagedProfile } from '@/types/admin-types';
import { UserX, Shield, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface QueueStats {
  pendingTotal: number;
  pendingToday: number;
  approvedToday: number;
  rejectedToday: number;
  avgReviewTimeHours: number;
}

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

const StatsBar: React.FC<{ stats: QueueStats | null; isLoading: boolean }> = ({ stats, isLoading }) => {
  const { t } = useLanguage();
  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-2xl bg-white/40 border border-gold-soft/10 animate-pulse" />)}
    </div>
  );
  if (!stats) return null;

  const items = [
    { label: t('adminMatrimony.verification.pendingTotal') || 'Pending', value: stats.pendingTotal, icon: Shield, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: t('adminMatrimony.verification.pendingToday') || 'Today', value: stats.pendingToday, icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: t('adminMatrimony.verification.approvedToday') || 'Approved', value: stats.approvedToday, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: t('adminMatrimony.verification.rejectedToday') || 'Rejected', value: stats.rejectedToday, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
    { label: t('adminMatrimony.verification.avgTime') || 'Avg Time', value: `${stats.avgReviewTimeHours}h`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-2xl p-3.5 border ${item.color} backdrop-blur-sm`}
        >
          <div className="flex items-center gap-2 mb-1">
            <item.icon size={14} strokeWidth={2} />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{item.label}</span>
          </div>
          <p className="text-xl font-black font-serif">{item.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

const EmptyState: React.FC<{ t: (key: string, options?: any) => string; onReset: () => void }> = ({ t, onReset }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/40 backdrop-blur-xl border border-gold-soft/20 rounded-[3rem] p-24 text-center group">
        <div className="w-24 h-24 bg-gold-soft/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500"><UserX className="w-12 h-12 text-gold-soft/40" /></div>
        <h3 className="text-2xl font-serif font-bold text-rosewood/60 mb-2">{t('adminMatrimony.verification.noProfiles') || 'No Profiles'}</h3>
        <p className="text-slate-400 font-medium max-w-xs mx-auto">{t('adminMatrimony.verification.noProfilesDesc') || 'There are no profiles waiting for verification at the moment.'}</p>
        <button onClick={onReset} className="mt-8 px-8 py-3 rounded-xl border border-gold-soft/30 text-rosewood font-black text-xs uppercase tracking-widest hover:bg-gold-soft/10 transition-all">{t('adminMatrimony.common.reset')}</button>
    </motion.div>
);

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }, exit: { opacity: 0, scale: 0.95, x: -20, transition: { duration: 0.2 } } };

const ProfileVerification: React.FC = () => {
    const { t, language, translateError } = useLanguage();
    const isTamil = language === 'ta';
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [dateSort, setDateSort] = React.useState<'asc' | 'desc' | null>('desc');
    const [nameSort, setNameSort] = React.useState<'asc' | 'desc' | null>(null);

    const queueQuery = useVerificationQueueQuery({
      page: 1,
      limit: 50,
      search: searchQuery || undefined,
    });
    const statsQuery = useVerificationStatsQuery();

    const qData: { profiles: any[] } = (queueQuery.data as any)?.profiles
      ? (queueQuery.data as any)
      : { profiles: [] };
    const isLoading = queueQuery.isPending;
    const stats = (statsQuery.data as unknown as QueueStats) ?? null;
    const statsLoading = statsQuery.isPending;

    const [auditProfileId, setAuditProfileId] = React.useState<string | null>(null);

    const handleReset = () => { setDateSort('desc'); setNameSort(null); setSearchQuery(''); };

    const sortedAndFiltered: AdminManagedProfile[] = (qData?.profiles || [])
        .sort((a: any, b: any) => {
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1500px] mx-auto">
            <StatsBar stats={stats} isLoading={statsLoading} />

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
                        {sortedAndFiltered.map((profile: any) => (
                            <motion.div key={profile.id} layout variants={itemVariants}>
                                <AdminProfileCard profile={{ ...profile, submittedAt: profile.createdAt } as any} adminActions={{
                                  onView: (id) => navigate(`/admin/matrimony/profiles/${id}`),
                                  onAudit: (id) => setAuditProfileId(id),
                                }} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <EmptyState t={t} onReset={handleReset} />
            )}

            <AuditPanel
              profileId={auditProfileId || ''}
              isOpen={auditProfileId !== null}
              onClose={() => setAuditProfileId(null)}
            />
        </motion.div>
    );
};

export default ProfileVerification;
