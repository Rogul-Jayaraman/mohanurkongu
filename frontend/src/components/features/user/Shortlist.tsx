import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfileCard, UserProfileCardSkeleton } from '@/components/features/user/UserProfileCard';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';


// ═══════════════════════════════════════════════════════════
// ShortlistSkeleton
// ═══════════════════════════════════════════════════════════
const ShortlistSkeleton: React.FC = () => (
    <div className="animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 pt-4">
            {[1, 2, 3, 4].map((i) => (
                <UserProfileCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// EmptyStateView
// ═══════════════════════════════════════════════════════════
const EmptyStateView: React.FC<{
    isSearching: boolean;
    t: (key: string, opts?: any) => string;
}> = ({ isSearching, t }) => (
    <div className="py-32 bg-ivory-dark/30 rounded-3xl border border-dashed border-gold/30 flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-rosewood/30 font-variation-light">
                {isSearching ? 'search_off' : 'favorite'}
            </span>
        </div>
        <h3 className="text-xl font-serif text-rosewood font-bold mb-2">
            {isSearching
                ? t('dashboard:no_search_results', { defaultValue: 'No matches found in shortlist' })
                : t('dashboard:no_shortlisted', { defaultValue: 'No Shortlisted Profiles' })}
        </h3>
        <p className="text-rosewood/60 text-sm italic">
            {isSearching
                ? t('dashboard:no_search_results_desc', { defaultValue: 'Try different keywords or check spelling.' })
                : t('dashboard:shortlist_hint', { defaultValue: 'Click the heart icon on any profile to save it here.' })}
        </p>
    </div>
);

// ═══════════════════════════════════════════════════════════
// ErrorStateView
// ═══════════════════════════════════════════════════════════
const ErrorStateView: React.FC<{
    t: (key: string, opts?: any) => string;
    onRetry: () => void;
}> = ({ t, onRetry }) => (
    <div className="py-20 text-center glass-card rounded-3xl border-rosewood/10">
        <span className="material-symbols-outlined text-5xl text-rosewood/40 mb-4 font-variation-light">error</span>
        <p className="text-rosewood/70 font-serif">{t('dashboard:error_title')}</p>
        <button onClick={onRetry} className="mt-4 px-6 py-2 bg-gold text-white rounded-full text-sm font-bold hover:bg-rosewood transition-colors shadow-sm">
            {t('dashboard:try_again')}
        </button>
    </div>
);

// ═══════════════════════════════════════════════════════════
// Shortlist (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const Shortlist: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const profiles: any[] = [];
    const loading = false;
    const error = null;
    const refetch = () => {};
    const isSearching = false;
    const filteredProfiles: any[] = [];
    const handleToggleShortlist = () => {};

    return (
        <div className="animate-in fade-in duration-700 max-w-7xl mx-auto w-full space-y-8 pb-20 px-2 md:px-4">
            <AnimatedSection>
                <PageHeader
                    title={isSearching
                        ? t('dashboard:search_results_title', { defaultValue: 'Search Result' })
                        : t('dashboard:shortlisted_profiles', { defaultValue: 'Shortlisted Profiles' })
                    }
                    description={isSearching
                        ? undefined
                        : t('dashboard:shortlisted_desc', { defaultValue: 'Profiles you have saved for later review' })
                    }
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    placeholder={t('common:search')}
                    actions={
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-rosewood/95 via-dark-rosewood/95 to-rosewood/95 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                {profiles.length}
                            </div>
                            <span className="text-rosewood/60 font-bold text-[10px] uppercase tracking-widest leading-none">
                                {t('common:profiles', { defaultValue: 'Profiles' })}
                            </span>
                        </div>
                    }
                />
            </AnimatedSection>

            <AnimatedSection>
                <div>
                    {loading && !profiles.length ? (
                        <ShortlistSkeleton />
                    ) : error ? (
                        <ErrorStateView t={t} onRetry={() => refetch()} />
                    ) : filteredProfiles.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 pt-4">
                            {filteredProfiles.map((profile) => (
                                <UserProfileCard
                                    key={profile.id}
                                    profile={profile}
                                    onToggleShortlist={handleToggleShortlist}
                                    variant="shortlist"
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyStateView isSearching={isSearching} t={t} />
                    )}
                </div>
            </AnimatedSection>

            <div className="flex justify-center pt-8 opacity-40">
                <div className="floral-divider max-w-sm" />
            </div>
        </div>
    );
};

export default Shortlist;
