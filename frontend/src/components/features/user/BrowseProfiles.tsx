import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { UserProfileCard, UserProfileCardSkeleton } from '@/components/features/user/UserProfileCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { useAuth } from '@/hooks/useAuth';
import { useBrowseProfiles } from '@/hooks/useProfileBrowse';
import { useMyCapabilitiesQuery } from '@/queries/useMembershipQueries';
import { BrowseProfileFilters, ActiveFilterChips } from '@/components/forms/user/BrowseProfileFilters';

// ═══════════════════════════════════════════════════════════
// InfiniteScrollTrigger
// ═══════════════════════════════════════════════════════════
const InfiniteScrollTrigger: React.FC<{
    onIntersect: () => void;
    hasMore: boolean;
    isLoading: boolean;
}> = ({ onIntersect, hasMore, isLoading }) => {
    const { t } = useTranslation();
    const observerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isLoading) {
                    onIntersect();
                }
            },
            { threshold: 0.1 }
        );
        if (observerRef.current) {
            observer.observe(observerRef.current);
        }
        return () => {
            if (observerRef.current) observer.unobserve(observerRef.current);
        };
    }, [hasMore, isLoading, onIntersect]);

    if (!hasMore) return null;

    return (
        <div ref={observerRef} className="py-8 flex justify-center items-center w-full mt-4">
            {isLoading ? (
                <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <span className="text-rosewood/40 text-sm font-medium">{t('browse:scrollMore')}</span>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// BrowseProfilesSkeleton
// ═══════════════════════════════════════════════════════════
const BrowseProfilesSkeleton: React.FC = () => (
    <div className="animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <UserProfileCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// GenderToggle
// ═══════════════════════════════════════════════════════════
interface GenderToggleProps {
    selectedGender: 'FEMALE' | 'MALE';
    onGenderChange: (gender: 'FEMALE' | 'MALE') => void;
}

const GenderToggle: React.FC<GenderToggleProps> = ({ selectedGender, onGenderChange }) => {
    const { t, i18n } = useTranslation('dashboard');
    const brideRef = useRef<HTMLButtonElement>(null);
    const groomRef = useRef<HTMLButtonElement>(null);
    const [indicator, setIndicator] = React.useState({ left: 0, width: 0 });

    useLayoutEffect(() => {
        const btn = selectedGender === 'FEMALE' ? brideRef.current : groomRef.current;
        if (btn) {
            setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
        }
    }, [selectedGender, i18n.language]);

    return (
        <div className="relative p-1.5 rounded-2xl flex items-center border border-gold/10 bg-ivory shadow-inner w-full md:w-fit">
            <motion.div
                className="absolute top-1.5 bottom-1.5 rounded-xl bg-linear-to-br from-rosewood/90 via-dark-rosewood/95 to-rosewood/90 shadow-lg shadow-rosewood/20 z-0"
                animate={{ left: indicator.left, width: indicator.width }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button
                ref={brideRef}
                onClick={() => onGenderChange('FEMALE')}
                className={`flex-1 px-6 py-2.5 rounded-xl relative z-10 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-colors duration-300 ${
                    selectedGender === 'FEMALE'
                        ? 'text-white'
                        : 'text-rosewood/40 hover:text-rosewood'
                }`}
            >
                <span className="material-symbols-outlined text-sm!">{selectedGender === 'FEMALE' ? 'verified_user' : 'person'}</span>
                {t('dashboard:bride')}
            </button>
            <button
                ref={groomRef}
                onClick={() => onGenderChange('MALE')}
                className={`flex-1 px-6 py-2.5 rounded-xl relative z-10 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-colors duration-300 ${
                    selectedGender === 'MALE'
                        ? 'text-white'
                        : 'text-rosewood/40 hover:text-rosewood'
                }`}
            >
                <span className="material-symbols-outlined text-sm!">{selectedGender === 'MALE' ? 'verified_user' : 'person'}</span>
                {t('dashboard:groom')}
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// BrowseProfilesHeader
// ═══════════════════════════════════════════════════════════
interface BrowseProfilesHeaderProps {
    title: string;
    description?: string;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    onFilterClick: (key?: string) => void;
    children?: React.ReactNode;
}

const BrowseProfilesHeader: React.FC<BrowseProfilesHeaderProps> = ({
    title, description, searchQuery, setSearchQuery, onFilterClick, children
}) => {
    const { t } = useTranslation(['common', 'dashboard', 'browse']);

    return (
        <div className="bg-ivory/95 backdrop-blur-md border-b border-gold/10 pt-3 md:pt-4 pb-4 md:pb-6 px-4 -mx-4 md:mx-0 md:rounded-b-2xl shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-2 md:space-y-4">
                <div className="hidden md:flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 flex items-center justify-center shrink-0 shadow-lg border border-gold/20 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-kolam-pattern opacity-10 group-hover:scale-125 transition-transform duration-700" />
                            <span className="material-symbols-outlined text-ivory/90 !text-xl relative z-10">groups</span>
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <h1 className="text-xl font-serif font-bold text-rosewood truncate">{title}</h1>
                            {description && <p className="text-rosewood/50 text-[10px] font-bold uppercase tracking-wider">{description}</p>}
                        </div>
                    </div>
                    {children && <div className="shrink-0 flex items-center justify-end">{children}</div>}
                </div>
                {children && <div className="flex md:hidden justify-center w-full px-4">{children}</div>}
                <div className="w-full px-2 md:px-0">
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFilterClick={() => onFilterClick('advanced')} placeholder={t('common:search')} />
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// NoResultsView
// ═══════════════════════════════════════════════════════════
interface NoResultsViewProps {
    isSearching: boolean;
    selectedGender: 'FEMALE' | 'MALE';
}

const NoResultsView: React.FC<NoResultsViewProps> = ({ isSearching, selectedGender }) => {
    const { t, i18n } = useTranslation(['dashboard', 'common']);
    const lang = i18n.language === 'ta';

    return (
        <div className="py-24 md:py-32 bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl flex flex-col items-center justify-center text-center px-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-linear-to-br from-ivory to-gold/30 text-rosewood border-2 border-gold/20 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-gold/5 group-hover:shadow-gold/20 group-hover:-translate-y-1 transition-all duration-500">
                    <span className="material-symbols-outlined text-5xl">{isSearching ? 'search_off' : 'person_off'}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-rosewood/10 border border-rosewood/20 flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-sm text-rosewood/40">filter_alt_off</span>
                </div>
            </div>
            <h3 className="text-2xl font-serif font-bold text-rosewood mb-3 text-balance max-w-md">
                {isSearching ? t('dashboard:no_search_results') : t('dashboard:no_profiles_found', { gender: selectedGender === 'FEMALE' ? t('dashboard:bride').toLowerCase() : t('dashboard:groom').toLowerCase() })}
            </h3>
            <p className="text-rosewood/60 text-sm font-medium max-w-sm leading-relaxed mb-8">
                {isSearching ? t('dashboard:no_search_results_desc') : t('dashboard:no_suggestions')}
            </p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-xs uppercase tracking-widest hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 hover:shadow-lg hover:shadow-rosewood/20 transition-all duration-300 active:scale-[0.97]">
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">refresh</span>
                    {t('browse:refresh')}
                </span>
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// ErrorStateView
// ═══════════════════════════════════════════════════════════
const ErrorStateView: React.FC<{
    message?: string;
    onRetry: () => void;
}> = ({ message, onRetry }) => {
    const { t, i18n } = useTranslation(['browse', 'dashboard']);
    const lang = i18n.language === 'ta';

    return (
        <div className="py-24 md:py-32 bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl flex flex-col items-center justify-center text-center px-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-rosewood/10 to-rosewood/5 text-rosewood border-2 border-rosewood/20 flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:shadow-rosewood/10 group-hover:-translate-y-1 transition-all duration-500">
                <span className="material-symbols-outlined text-4xl">error_outline</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-rosewood mb-3 text-balance max-w-md">
                {lang ? t('browse:error_loading_ta', 'ஏதோ தவறு ஏற்பட்டுள்ளது') : t('browse:error_loading')}
            </h3>
            <p className="text-rosewood/60 text-sm font-medium max-w-sm mx-auto leading-relaxed mb-8">
                {message || t('browse:error_desc')}
            </p>
            <button onClick={onRetry} className="px-8 py-3 rounded-xl bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 text-white border border-rosewood/20 font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-rosewood/20 transition-all duration-300 active:scale-[0.97]">
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">refresh</span>
                    {t('browse:try_again')}
                </span>
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// NoDataView
// ═══════════════════════════════════════════════════════════
const NoDataView: React.FC<{
    selectedGender: 'FEMALE' | 'MALE';
}> = ({ selectedGender }) => {
    const { t, i18n } = useTranslation(['browse', 'dashboard']);
    const lang = i18n.language === 'ta';
    const genderLabel = selectedGender === 'FEMALE'
        ? t('dashboard:bride').toLowerCase()
        : t('dashboard:groom').toLowerCase();

    return (
        <div className="py-24 md:py-32 bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl flex flex-col items-center justify-center text-center px-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-ivory to-gold/30 text-rosewood border-2 border-gold/20 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-gold/5 group-hover:shadow-gold/20 group-hover:-translate-y-1 transition-all duration-500">
                <span className="material-symbols-outlined text-4xl">person_off</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-rosewood mb-3 text-balance max-w-md">
                {t('browse:no_profiles_found')}
            </h3>
            <p className="text-rosewood/60 text-sm font-medium max-w-sm mx-auto leading-relaxed mb-8">
                {t('dashboard:no_suggestions', { gender: genderLabel })}
            </p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-xs uppercase tracking-widest hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 hover:shadow-lg hover:shadow-rosewood/20 transition-all duration-300 active:scale-[0.97]">
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">refresh</span>
                    {t('browse:refresh')}
                </span>
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// BrowseProfiles (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const BrowseProfiles: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [searchLevel, setSearchLevel] = useState('BASIC');
    const [selectedGender, setSelectedGender] = React.useState<'MALE' | 'FEMALE'>('FEMALE');
    const handleGenderChange = (gender: 'MALE' | 'FEMALE') => { setSelectedGender(gender); };

    const { data: capsData } = useMyCapabilitiesQuery();
    const capsInfo = (capsData as any)?.capabilities as { searchLevel?: string; openLimit?: number; openRemaining?: number } | undefined;
    useEffect(() => {
      if (capsInfo?.searchLevel) setSearchLevel(capsInfo.searchLevel);
    }, [capsInfo]);

    const openLimit = capsInfo?.openLimit ?? -1;
    const openRemaining = capsInfo?.openRemaining ?? -1;
    const showQuota = openLimit >= 0;

    const {
        profiles,
        isLoading,
        isFetchingNextPage,
        error,
        hasNextPage,
        fetchNextPage,
        refetch,
    } = useBrowseProfiles({ gender: selectedGender, searchQuery, filters });

    const hasActiveFilters = searchQuery.trim().length > 0 || Object.keys(filters).length > 0;

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev: any) => {
            const updated = { ...prev, [key]: value };
            if (!value && value !== 0) delete updated[key];
            return updated;
        });
    };

    const handleResetFilters = () => { setFilters({}); };

    return (
        <div className="animate-in fade-in duration-700 max-w-7xl mx-auto w-full pb-10 px-2 md:px-4">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <BrowseProfilesHeader
                        title={selectedGender === 'MALE' ? t('browse:browse_grooms') : t('browse:browse_brides')}
                        description={t('browse:page_desc')}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onFilterClick={() => setShowFilters(true)}
                    >
                        <div className="flex items-center gap-2">
                            {showQuota && (
                                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold border ${openRemaining === 0 ? 'bg-red-50 text-red-600 border-red-200' : openRemaining <= 3 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-ivory text-rosewood/50 border-gold/10'}`}>
                                    <span>{openRemaining <= 0 ? '0' : openRemaining}/{openLimit}</span>
                                    <span className="opacity-60">{'views'}</span>
                                </div>
                            )}
                            {!hasActiveFilters && (
                                <GenderToggle selectedGender={selectedGender} onGenderChange={handleGenderChange} />
                            )}
                        </div>
                    </BrowseProfilesHeader>

                    <div className="space-y-4">
                        <ActiveFilterChips filters={filters} onClear={(key) => handleFilterChange(key, '')} onClearAll={handleResetFilters} />
                    </div>

                    <AnimatedSection>
                    {isLoading && profiles.length === 0 ? (
                        <BrowseProfilesSkeleton />
                    ) : error ? (
                        <ErrorStateView onRetry={() => refetch()} />
                    ) : profiles && profiles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-6">
                                {profiles.map((profile) => (
                                    <UserProfileCard key={profile.id} profile={profile} variant="browse" onToggleShortlist={() => refetch()} />
                                ))}
                            </div>
                            <InfiniteScrollTrigger onIntersect={() => fetchNextPage()} hasMore={!!hasNextPage} isLoading={isFetchingNextPage} />
                        </>
                    ) : hasActiveFilters ? (
                        <NoResultsView isSearching={true} selectedGender={selectedGender} />
                    ) : (
                        <NoDataView selectedGender={selectedGender} />
                    )}
                    </AnimatedSection>
                </div>
            </div>

            <BrowseProfileFilters
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                setFilters={setFilters}
                onApply={() => setShowFilters(false)}
                searchLevel={searchLevel}
            />

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default BrowseProfiles;
