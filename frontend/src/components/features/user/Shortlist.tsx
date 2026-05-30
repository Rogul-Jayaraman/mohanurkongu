import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfileCard, UserProfileCardSkeleton } from '@/components/features/user/UserProfileCard';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { fetchShortlisted } from '@/api/profile.api';
import type { ProfileSummary } from '@/types/profile';


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
    <div className="py-24 md:py-32 bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="w-20 h-20 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">
                {isSearching ? 'search_off' : 'favorite'}
            </span>
        </div>
        <h3 className="text-xl font-serif font-bold text-rosewood mb-2">
            {isSearching
                ? t('dashboard:no_search_results', { defaultValue: 'No matches found in shortlist' })
                : t('dashboard:no_shortlisted', { defaultValue: 'No Shortlisted Profiles' })}
        </h3>
        <p className="text-rosewood/60 text-sm font-medium max-w-sm mx-auto leading-relaxed mb-8">
            {isSearching
                ? t('dashboard:no_search_results_desc', { defaultValue: 'Try different keywords or check spelling.' })
                : t('dashboard:shortlist_hint', { defaultValue: 'Click the heart icon on any profile to save it here.' })}
        </p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-xs uppercase tracking-widest hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 transition-all duration-300">
            {t('common:refresh', { defaultValue: 'Refresh' })}
        </button>
    </div>
);

// ═══════════════════════════════════════════════════════════
// ErrorStateView
// ═══════════════════════════════════════════════════════════
const ErrorStateView: React.FC<{
    t: (key: string, opts?: any) => string;
    onRetry: () => void;
}> = ({ t, onRetry }) => (
    <div className="py-24 md:py-32 bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="w-20 h-20 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">error_outline</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-rosewood mb-2">
            {t('dashboard:error_title', { defaultValue: 'Something went wrong' })}
        </h3>
        <p className="text-rosewood/60 text-sm font-medium max-w-sm mx-auto leading-relaxed mb-8">
            {t('dashboard:error_desc', { defaultValue: 'We couldn\'t load your shortlisted profiles. Please try again.' })}
        </p>
        <button onClick={onRetry} className="px-8 py-3 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-xs uppercase tracking-widest hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 transition-all duration-300">
            {t('dashboard:try_again', { defaultValue: 'Try Again' })}
        </button>
    </div>
);

// ═══════════════════════════════════════════════════════════
// Shortlist (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const Shortlist: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadShortlisted = useCallback(async (q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = {};
        if (q?.trim()) params.q = q.trim();
        const data = await fetchShortlisted(params);
        setProfiles(data.profiles);
      } catch (err: any) {
        setError(err?.message || 'Failed to load shortlisted profiles');
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => { loadShortlisted(searchQuery); }, [searchQuery, loadShortlisted]);

    const isSearching = searchQuery.trim().length > 0;

    const handleToggleShortlist = (profileId: string, isShortlisted: boolean) => {
      if (!isShortlisted) {
        setProfiles(prev => prev.filter(p => p.id !== profileId));
      }
    };

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
                        <ErrorStateView t={t} onRetry={() => loadShortlisted()} />
                    ) : profiles.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 pt-4">
                            {profiles.map((profile: any) => (
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
