import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { UserProfileCard, UserProfileCardSkeleton } from '@/components/features/user/UserProfileCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { useTranslation } from 'react-i18next';
import { indexedDBStorage } from '@/lib/indexeddb';
import { ConfirmationModal } from '@/modals/user/ConfirmationModal';
import { useMyProfilesQuery } from '@/queries/useProfileQueries';
import { useDeleteDraftMutation } from '@/queries/useProfileMutations';

// ═══════════════════════════════════════════════════════════
// MyProfilesSkeleton
// ═══════════════════════════════════════════════════════════
const MyProfilesSkeleton: React.FC = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
            <div className="w-full flex-1 h-12 skeleton rounded-full! border border-gold-500/10" />
            <div className="w-full sm:w-48 h-12 skeleton rounded-full! bg-rosewood/5! border border-rosewood/10" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <UserProfileCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// EmptyStateView
// ═══════════════════════════════════════════════════════════
const EmptyStateView: React.FC<{
    hasAnyProfiles: boolean;
    isSearching: boolean;
    onCreateNew: () => void;
    onClearSearch: () => void;
    t: (key: string, opts?: any) => string;
}> = ({ hasAnyProfiles, isSearching, onCreateNew, onClearSearch, t }) => (
    <div className="text-center py-20 bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-1000 relative overflow-hidden">
        <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="w-20 h-20 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">
                {!hasAnyProfiles ? 'person_add' : 'search_off'}
            </span>
        </div>
        <h3 className="text-xl font-serif font-bold text-rosewood mb-2">
            {!hasAnyProfiles ? t('myprofiles:no_profiles_title') : t('common:no_results')}
        </h3>
        <p className="text-rosewood/60 text-sm font-medium max-w-sm mx-auto mb-8 px-6">
            {!hasAnyProfiles ? t('myprofiles:no_profiles_desc') : t('common:profile_not_found_desc')}
        </p>
        {!hasAnyProfiles && (
            <button onClick={onCreateNew} className="px-8 py-3 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-sm hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 transition-all duration-300">
                {t('myprofiles:create_first_profile')}
            </button>
        )}
        {hasAnyProfiles && isSearching && (
            <button onClick={onClearSearch} className="px-6 py-2 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-sm hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 transition-all duration-300">
                {t('common:all')}
            </button>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════
// MyProfiles (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const MyProfiles: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['myprofiles', 'common']);
    const [searchQuery, setSearchQuery] = useState('');
    const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

    const myProfilesQuery = useMyProfilesQuery(searchQuery || undefined);
    const deleteMutation = useDeleteDraftMutation();

    const profiles: any[] = (myProfilesQuery.data as any[]) ?? [];
    const loading = myProfilesQuery.isPending;
    const deletePending = deleteMutation.isPending;

    const handleCreateNew = async () => {
        await indexedDBStorage.clearDraft();
        navigate('/manamaalai/new-profile');
    };
    const handleCompleteProfile = (id: string) => { navigate(`/manamaalai/new-profile?id=${id}`); };
    const hasAnyProfiles = (profiles || []).length > 0;
    const isSearching = searchQuery.trim().length > 0;

    const confirmDelete = () => {
        if (profileToDelete) {
            deleteMutation.mutate(profileToDelete, {
                onSuccess: () => {
                    setProfileToDelete(null);
                },
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto w-full pb-16 px-2 md:px-4">
            <AnimatedSection>
                <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                    <div className="w-full flex-1">
                        <SearchBar 
                            searchQuery={searchQuery} 
                            setSearchQuery={setSearchQuery} 
                            placeholder={t('common:search')} 
                        />
                    </div>
                    <button 
                        onClick={handleCreateNew} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 h-11 md:h-12 rounded-2xl bg-linear-to-br from-ivory to-gold/30 text-rosewood shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.05)] border border-gold/10 transition-all duration-500 hover:border-rosewood/50 hover:bg-linear-to-br hover:from-rosewood/95 hover:via-dark-rosewood/95 hover:to-rosewood/95 hover:text-white hover:shadow-lg hover:shadow-rosewood/20 hover:-translate-y-0.5 font-black hover:scale-[1.02] active:scale-95 whitespace-nowrap text-xs group"
                    >
                        <Plus className="w-4 h-4 text-current transition-colors duration-500" />
                        <span>{t('myprofiles:create_new')}</span>
                    </button>
                </div>
            </AnimatedSection>

            <div className="space-y-4">
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 pt-4">
                        {[1, 2, 3, 4].map((i) => (
                            <UserProfileCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        <AnimatedSection>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 pt-4">
                                <AnimatePresence mode="popLayout">
                                    {profiles.map((p: any, index: number) => (
                                        <motion.div 
                                            key={p.id} 
                                            initial={{ opacity: 0, y: 20 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, scale: 0.95 }} 
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <UserProfileCard
                                                profile={p}
                                                isOwnProfile={true}
                                                variant="myprofiles"
                                                onDelete={p.status === 'DRAFT' ? (id: string) => setProfileToDelete(id) : undefined}
                                                onComplete={p.status === 'DRAFT' ? handleCompleteProfile : undefined}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </AnimatedSection>

                        {profiles.length === 0 && (
                            <AnimatedSection>
                                <EmptyStateView
                                    hasAnyProfiles={hasAnyProfiles}
                                    isSearching={isSearching}
                                    onCreateNew={handleCreateNew}
                                    onClearSearch={() => setSearchQuery('')}
                                    t={t}
                                />
                            </AnimatedSection>
                        )}
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!profileToDelete}
                onClose={() => setProfileToDelete(null)}
                onConfirm={confirmDelete}
                isLoading={deletePending}
                title={t('common:confirm_delete_title') || t('common:confirm_delete')}
                message={t('common:confirm_delete_message') || 'Are you sure you want to delete this profile? This action cannot be undone.'}
                confirmText={t('common:delete') || 'Delete'}
            />
        </div>
    );
};

export default MyProfiles;
