import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDateFormatter } from "../../../hooks/useDateFormatter";
import { useTranslations } from "../../../hooks/useTranslations";
import { useInitials } from "../../../hooks/useInitials";
import { useAuth } from "../../../hooks/useAuth";
import { useBrowseProfiles } from "../../../hooks/useProfileBrowse";
import { UserProfileCard, UserProfileCardSkeleton } from "./UserProfileCard";
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { formatFullName } from "../../../utils/formatName";


/**
 * WelcomeHeaderSkeleton – skeleton for the greeting and membership panel.
 */
export const WelcomeHeaderSkeleton: React.FC = () => (
  <div className="relative w-full mb-8">
    <div className="relative overflow-hidden rounded-xl bg-ivory border border-gold/10 shadow-sm min-h-[110px]">
      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1 p-5 sm:p-6 lg:px-10 flex items-center">
          <div className="space-y-2">
            <div className="h-2 w-24 skeleton rounded-full" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-32 skeleton rounded-lg" />
              <div className="h-8 w-48 skeleton rounded-lg" />
            </div>
            <div className="h-2 w-40 skeleton rounded-full" />
          </div>
        </div>
        <div className="md:w-[320px] p-5 sm:p-6 lg:px-10 border-t md:border-t-0 md:border-l border-gold/10 bg-gold-soft/5 flex flex-col justify-center space-y-4">
          <div className="flex justify-between">
            <div className="h-2 w-16 skeleton rounded-full" />
            <div className="h-4 w-20 skeleton rounded-lg" />
          </div>
          <div className="h-px bg-gold/10" />
          <div className="flex justify-between">
            <div className="h-2 w-20 skeleton rounded-full" />
            <div className="h-4 w-24 skeleton rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * DashboardSkeleton – loading state placeholder matching the actual dashboard layout.
 * Mirrors: Welcome Header | Featured Matches (Brides/Grooms) | Our Plans | Upgrade Sections
 */
export const DashboardSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto w-full space-y-12 pb-16 animate-in fade-in duration-500">
    <WelcomeHeaderSkeleton />

    {/* Featured Matches Section (Brides) Skeleton */}
    <div className="space-y-8">
      <div className="flex items-end justify-between border-b border-gold-500/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-gold-500 rounded-full" />
            <div className="h-6 w-48 skeleton" />
          </div>
          <div className="h-3 w-64 skeleton rounded-full! ml-4" />
        </div>
        <div className="h-4 w-20 skeleton" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <UserProfileCardSkeleton key={i} />
        ))}
      </div>
    </div>

    {/* Featured Matches Section (Grooms) Skeleton */}
    <div className="space-y-8">
      <div className="flex items-end justify-between border-b border-gold-500/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-gold-500 rounded-full" />
            <div className="h-6 w-48 skeleton" />
          </div>
          <div className="h-3 w-64 skeleton rounded-full! ml-4" />
        </div>
        <div className="h-4 w-20 skeleton" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <UserProfileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);



/**
 * WelcomeHeaderSection – greeting + membership info panel.
 */
export const WelcomeHeaderSection: React.FC<{ user: any; isLoading?: boolean }> = ({ user, isLoading }) => {
  const { t, i18n } = useTranslations(["common", "dashboard"]);
  const { formatDate } = useDateFormatter();
  const { getInitials } = useInitials();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard:good_morning");
    if (hour < 17) return t("dashboard:good_afternoon");
    return t("dashboard:good_evening");
  };

  const fullName =
    i18n.language === "ta"
      ? formatFullName(user?.firstNameTa, user?.lastNameTa)
      : formatFullName(user?.firstNameEn, user?.lastNameEn) || "User";

  return (
    <div className="relative w-full mb-8">
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-white via-ivory to-white shadow-lg shadow-gold/5 border border-gold/10">
        <div className="absolute inset-0 bg-kolam-pattern opacity-[0.03] scale-125 pointer-events-none" />
        <div className="absolute right-0 top-0 w-1/3 h-full bg-linear-to-l from-gold/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-stretch min-h-[110px]">
          <div className="flex-1 p-5 sm:p-6 lg:px-10 flex items-center">
            <div className="space-y-0.5">
              <span className="text-gold font-black tracking-widest uppercase block text-[9px] sm:text-[10px]">
                {getGreeting()}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-rosewood tracking-tight">
                <span className="text-rosewood/50 font-medium mr-2">
                  {t("dashboard:welcome")},
                </span>
                {isLoading ? (
                  <span className="inline-block h-8 w-48 skeleton rounded-lg translate-y-1" />
                ) : (
                  <span className="text-rosewood">{fullName}</span>
                )}
              </h2>
              {isLoading ? (
                <div className="h-3 w-40 skeleton rounded-full mt-2" />
              ) : null}
            </div>
          </div>

          <div className="md:w-[320px] p-5 sm:p-6 lg:px-10 border-t md:border-t-0 md:border-l border-gold/10 bg-gold-soft/5 flex flex-col justify-center">
            <div className="space-y-3">
              <div className="flex justify-between items-center group">
                <span className="text-[10px] text-rosewood/50 font-bold uppercase tracking-wider">
                  {t("dashboard:plan_label")}
                </span>
                {isLoading ? (
                  <div className="h-4 w-20 skeleton rounded-lg" />
                ) : (
                  <span className="text-sm font-serif font-black tracking-wide text-rosewood">
                    {user?.membership?.planCode || t("dashboard:basic_plan")}
                  </span>
                )}
              </div>
              {user?.membership?.expiresAt && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-rosewood/50 font-bold uppercase tracking-wider">
                    {i18n.language === 'ta' ? 'காலாவதி' : 'Expires'}
                  </span>
                  <span className="text-xs text-rosewood/70">
                    {formatDate(user.membership.expiresAt)}
                  </span>
                </div>
              )}
              <div className="pt-1">
                <Link
                  to="/manamaalai/my-account?tab=plans"
                  className="block text-center text-[10px] font-bold uppercase tracking-widest text-gold hover:text-rosewood transition-colors"
                >
                  {i18n.language === 'ta' ? 'மேம்படுத்துக' : 'Upgrade'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * EmptySection – glass-morphism card with rosewood accent for zero-profile state.
 */
const EmptySection: React.FC<{ gender: "MALE" | "FEMALE" }> = ({ gender }) => {
  const { t, i18n } = useTranslations(["dashboard", "common"]);
  const lang = i18n.language === 'ta';
  const genderLabel = gender === 'FEMALE'
    ? (lang ? 'பெண்' : 'bride')
    : (lang ? 'ஆண்' : 'groom');
  return (
    <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl p-12 flex flex-col items-center justify-center text-center overflow-hidden group">
      <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="w-20 h-20 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl">person_off</span>
      </div>
      <h3 className="text-xl font-serif font-bold text-rosewood mb-1">
        {t("dashboard:no_profiles_found", { gender: genderLabel })}
      </h3>
      <p className="text-rosewood/50 text-sm font-medium max-w-xs leading-relaxed mb-8">
        {t("dashboard:no_suggestions")}
      </p>
      <Link
        to={`/manamaalai/browse-profiles?gender=${gender === "FEMALE" ? "bride" : "groom"}`}
        className="px-8 py-3 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-xs uppercase tracking-widest hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 transition-all duration-300"
      >
        {lang ? 'அனைத்து பதிவுகளையும் காண' : 'Browse All Profiles'}
      </Link>
    </div>
  );
};

/**
 * SectionErrorState – glass-morphism card for individual section failure.
 */
const SectionErrorState: React.FC<{
  onRetry: () => void;
}> = ({ onRetry }) => {
  const { t, i18n } = useTranslations(["dashboard", "common"]);
  const lang = i18n.language === 'ta';
  return (
    <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl p-12 flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 bg-kolam-pattern opacity-[0.02] scale-125 pointer-events-none" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="w-16 h-16 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl">error_outline</span>
      </div>
      <p className="text-rosewood/60 text-sm font-medium leading-relaxed mb-6 max-w-xs">
        {lang ? 'வரன்களை ஏற்ற முடியவில்லை' : t("dashboard:error_desc")}
      </p>
      <button
        onClick={onRetry}
        className="px-8 py-3 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood border border-gold/10 font-bold text-xs uppercase tracking-widest hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 transition-all duration-300"
      >
        {lang ? 'மீண்டும் முயலவும்' : t("dashboard:try_again")}
      </button>
    </div>
  );
};

/**
 * FeaturedMatchesSection – profile grid by gender with header and view-all link.
 */
export const FeaturedMatchesSection: React.FC<{
  gender: "MALE" | "FEMALE";
  title: string;
  description: string;
  profiles: any[];
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
}> = ({ gender, title, description, profiles, isLoading, error, onRefetch }) => {
  const { t } = useTranslations(["common", "dashboard"]);
  const profilesList = profiles || [];
  const isEmpty = !isLoading && !error && profilesList.length === 0;
  return (
    <section className="space-y-8">
      <SectionHeader
        title={title}
        subtitle={description}
        action={
          <Link
            to={`/manamaalai/browse-profiles?gender=${gender === "FEMALE" ? "bride" : "groom"}`}
            className="group text-xs font-bold text-rosewood hover:text-gold transition-colors"
          >
            <span className="group-hover:underline decoration-1 underline-offset-4">{t("dashboard:view_all")}</span>
            <span className="inline-block ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        }
      />
      {error ? (
        <SectionErrorState onRetry={onRefetch} />
      ) : isEmpty ? (
        <EmptySection gender={gender} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <UserProfileCardSkeleton key={i} />
              ))
            : profilesList
                .slice(0, 4)
                .map((profile, index) => (
                  <UserProfileCard
                    key={profile.id || profile.profileId || index}
                    profile={profile}
                    variant="browse"
                  />
                ))}
        </div>
      )}
    </section>
  );
};





/**
 * ErrorState – error display card with retry button.
 */
export const ErrorState: React.FC<{
  message: string;
  onRetry: () => void;
  t: (key: string, options?: Record<string, any>) => string;
}> = ({ message, onRetry, t }) => (
  <div className="py-20 text-center glass-card rounded-xl border border-rosewood/10 shadow-sm bg-white max-w-2xl mx-auto my-10">
    <span className="material-symbols-outlined text-5xl text-rosewood/40 mb-4 font-variation-light">
      error
    </span>
    <p className="text-rosewood/70 font-serif font-bold text-xl">
      {t("dashboard:error_title", { defaultValue: "Something went wrong" })}
    </p>
    <p className="text-rosewood/60 mt-2 text-sm italic">
      {message ||
        t("dashboard:error_desc", {
          defaultValue: "We couldn't load your dashboard. Please try again.",
        })}
    </p>
    <button
      onClick={onRetry}
      className="mt-6 px-8 py-2.5 bg-gold text-white rounded-xl text-sm font-bold hover:bg-rosewood transition-all duration-300 shadow-md transform hover:-translate-y-1"
    >
      {t("dashboard:try_again", { defaultValue: "Try Again" })}
    </button>
  </div>
);

/**
 * PaymentSection – payment info cards (bank transfer, GPay/PhonePe, visit address).
 */


/**
 * Dashboard – orchestrator that manages data fetching, loading/error/success states, and composes sub-sections.
 */
export const Dashboard: React.FC = () => {
  const { t } = useTranslations(['dashboard']);
  const { user, loading: authLoading } = useAuth();

  // Stable filter references to prevent infinite re-fetch loop
  const brideFilters = useMemo(() => ({ limit: 4, sort: 'createdAt_desc' }), []);
  const groomFilters = useMemo(() => ({ limit: 4, sort: 'createdAt_desc' }), []);

  // Fetch latest bride profiles (female)
  const { 
    profiles: bridesProfiles, 
    isLoading: bridesLoading, 
    error: bridesError 
  } = useBrowseProfiles({ 
    gender: 'FEMALE',
    searchQuery: '',
    filters: brideFilters
  });

  // Fetch latest groom profiles (male)
  const { 
    profiles: groomsProfiles, 
    isLoading: groomsLoading, 
    error: groomsError 
  } = useBrowseProfiles({ 
    gender: 'MALE',
    searchQuery: '',
    filters: groomFilters
  });

  const brides = bridesProfiles || [];
  const grooms = groomsProfiles || [];

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto w-full space-y-12 pb-16">
      <AnimatedSection>
        <WelcomeHeaderSection user={user} isLoading={authLoading} />
      </AnimatedSection>

      <AnimatedSection>
        <FeaturedMatchesSection
          gender="FEMALE"
          title={t("dashboard:search_bride_title")}
          description={t("dashboard:search_bride_desc")}
          profiles={brides}
          isLoading={bridesLoading}
          error={bridesError}
          onRefetch={() => { /* refetch brides */ }}
        />
      </AnimatedSection>

      <AnimatedSection>
        <FeaturedMatchesSection
          gender="MALE"
          title={t("dashboard:search_groom_title")}
          description={t("dashboard:search_groom_desc")}
          profiles={grooms}
          isLoading={groomsLoading}
          error={groomsError}
          onRefetch={() => { /* refetch grooms */ }}
        />
      </AnimatedSection>

    </div>
  );
};
