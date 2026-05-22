import React from "react";
import { Link } from "react-router-dom";
import { useDateFormatter } from "../../../hooks/useDateFormatter";
import { useTranslations } from "../../../hooks/useTranslations";
import { useInitials } from "../../../hooks/useInitials";
import { useAuth } from "../../../context/AuthContext";
import { useDashboard } from "../../../hooks/useDashboard";
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
        <div className="absolute inset-0 bg-[url('/assets/images/kolam-gold.png')] opacity-[0.03] scale-125 pointer-events-none" />
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
                    {t("dashboard:basic_plan")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
}> = ({ gender, title, description, profiles, isLoading }) => {
  const { t } = useTranslations(["common", "dashboard"]);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <UserProfileCardSkeleton key={i} />
            ))
          : (profiles || [])
              .slice(0, 4)
              .map((profile, index) => (
                <UserProfileCard
                  key={profile.profileId || index}
                  profile={profile}
                  variant="browse"
                />
              ))}
      </div>
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
  const { user, loading: dashboardLoading, data, brides, grooms, error, refetch, t } =
    useDashboard();
  const { loading: authLoading } = useAuth();

  const loading = dashboardLoading && !data;
  const isHeaderLoading = authLoading || (loading && !user);

  if (error) {
    return <ErrorState message="" onRetry={() => refetch()} t={t} />;
  }

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto w-full space-y-12 pb-16">
      <AnimatedSection>
        <WelcomeHeaderSection user={user} isLoading={isHeaderLoading} />
      </AnimatedSection>

      <AnimatedSection>
        <FeaturedMatchesSection
          gender="FEMALE"
          title={t("dashboard:search_bride_title")}
          description={t("dashboard:search_bride_desc")}
          profiles={brides}
          isLoading={loading && !data}
        />
      </AnimatedSection>

      <AnimatedSection>
        <FeaturedMatchesSection
          gender="MALE"
          title={t("dashboard:search_groom_title")}
          description={t("dashboard:search_groom_desc")}
          profiles={grooms}
          isLoading={loading && !data}
        />
      </AnimatedSection>

    </div>
  );
};
