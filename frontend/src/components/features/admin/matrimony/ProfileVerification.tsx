import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { SearchAndSort } from '@/components/ui/table/SearchAndSort';
import { AdminProfileCard } from '@/components/features/admin/matrimony/ProfileCard';
import { fetchVerificationQueue } from '@/api/verification.api';
import { toast } from 'sonner';
import type { AdminManagedProfile } from '@/types/admin-types';
import { UserX } from 'lucide-react';

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
const EmptyState: React.FC<{ t: (key: string, options?: any) => string; onReset: () => void }> = ({ t, onReset }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/40 backdrop-blur-xl border border-gold-soft/20 rounded-[3rem] p-24 text-center group">
        <div className="w-24 h-24 bg-gold-soft/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500"><UserX className="w-12 h-12 text-gold-soft/40" /></div>
        <h3 className="text-2xl font-serif font-bold text-rosewood/60 mb-2">{t('adminMatrimony.verification.noProfiles') || 'No Profiles'}</h3>
        <p className="text-slate-400 font-medium max-w-xs mx-auto">{t('adminMatrimony.verification.noProfilesDesc') || 'There are no profiles waiting for verification at the moment.'}</p>
        <button onClick={onReset} className="mt-8 px-8 py-3 rounded-xl border border-gold-soft/30 text-rosewood font-black text-xs uppercase tracking-widest hover:bg-gold-soft/10 transition-all">{t('adminMatrimony.common.reset')}</button>
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

    const [qData, setQData] = React.useState<{ profiles: any[] }>({ profiles: [] });
    const [isLoading, setIsLoading] = React.useState(true);
    React.useEffect(() => {
      setIsLoading(true);
      fetchVerificationQueue({ page: 1, limit: 50, search: searchQuery || undefined })
        .then((res: any) => setQData({ profiles: res.profiles || [] }))
        .catch(() => { toast.error(translateError('VERIFICATION_QUEUE_FAILED') || 'Failed to load queue'); setQData({ profiles: [] }); })
        .finally(() => setIsLoading(false));
    }, [searchQuery]);

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
                                <AdminProfileCard profile={{ ...profile, submittedAt: profile.createdAt } as any} adminActions={{ onView: (id) => navigate(`/admin/matrimony/profiles/${id}`) }} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <EmptyState t={t} onReset={handleReset} />
            )}
        </motion.div>
    );
};

export default ProfileVerification;
