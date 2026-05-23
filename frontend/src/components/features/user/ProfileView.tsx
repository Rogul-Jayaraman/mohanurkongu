import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { stubFetchProfile } from '@/utils/stubs';
import { useAuth } from "@/hooks/useAuth";
import { useProfileUtils } from "@/hooks/useProfileUtils";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { getBilingualValue } from "@/utils/bilingual";
const getImageUrl = (url: string | null | undefined): string | null => { if (!url || typeof url !== 'string') return null; if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url; return null; };
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  FileText,
  Lock,
  Sparkles,
  User,
  Users,
  Briefcase,
  Heart,
  Building2,
  Map,
  Camera,
  ShieldAlert,
  Info,
} from "lucide-react";

import {
  SectionCard3D,
  SectionHeaderRedesigned,
  DetailRow,
  SectionDivider,
} from "@/components/features/matrimony/ProfileViewPrimitives";

import { D1Chart, D9Chart } from "@/components/shared/horoscope";
import type { PlanetData, HoroscopeResult } from "@/types/horoscope";
import PrintProfile, { JathagamPrintView } from "./PrintProfile";
import {
  PROFILE_FOR_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  DIET_OPTIONS,
  COMPLEXION_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  KULAM_OPTIONS,
  HEIGHT_OPTIONS,
  JOB_SECTOR_OPTIONS,
  RESIDENCE_OPTIONS,
  NAKSHATRA_OPTIONS,
  RASI_OPTIONS,
  DOSHAM_OPTIONS,
  GENDER_OPTIONS,
} from "@/constants/index";

// ═══════════════════════════════════════════════════════════
// Quick Nav
// ═══════════════════════════════════════════════════════════
const NAV_KEYS: { id: string; key: string }[] = [
  { id: "basic", key: "basic" },
  { id: "personal", key: "personal" },
  { id: "community", key: "community" },
  { id: "professional", key: "professional" },
  { id: "family", key: "family" },
  { id: "assets", key: "assets" },
  { id: "horoscope", key: "horoscope" },
  { id: "gallery", key: "gallery" },
];

const QuickNav: React.FC = () => {
  const [activeSection, setActiveSection] = useState("");
  const { t } = useTranslation(["common"]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "");
            setActiveSection(id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    NAV_KEYS.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="no-print relative">
      <div className="flex items-center h-11 sm:h-12 overflow-x-auto overflow-y-hidden scrollbar-hide sm:overflow-visible">
        {NAV_KEYS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id);
                const el = document.getElementById(`section-${s.id}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`h-full px-3 sm:px-5 flex items-center font-serif font-bold
                          text-[11px] sm:text-sm whitespace-nowrap shrink-0
                          transition-colors duration-200 relative select-none
                          ${isActive
                            ? "text-rosewood"
                            : "text-rosewood/60 hover:text-rosewood"}`}
            >
              <span>{t(`section_nav.${s.key}`)}</span>
              {isActive && (
                <div className="absolute bottom-0 left-3 sm:left-5 right-3 sm:right-5 h-0.5 bg-gold rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewHeader
// ═══════════════════════════════════════════════════════════
const ProfileViewHeader: React.FC<{ profile: any; isLoading: boolean }> = ({
  profile,
  isLoading,
}) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const { t, getEnumLabel, getLocationLabel, calculateAge } = useProfileUtils();
  const { formatDate } = useDateFormatter();
  const isTamil = i18n.language === "ta";
  const { user } = useAuth();
  const isOwner = !!(profile && user && (profile.isOwner || profile.userId === user.id));

  const name = profile
    ? isTamil
      ? [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ')
      : [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') || [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ')
    : "";

  const currentLocation = profile
    ? getLocationLabel(
        profile.currentDistrictEn || profile.currentDistrict,
        profile.currentTaluk || profile.currentCityEn,
        profile.currentDistrictTa,
        profile.currentTalukTa,
        profile.currentCityEn,
        profile.currentStateEn,
        profile.currentCountryEn,
        profile.currentCityTa,
        profile.currentStateTa,
        profile.currentCountryTa,
      )
    : "";

  const profilePhotoUrl = getImageUrl(profile?.profilePhoto) || "";
  const ageDisplay = profile?.dob
    ? `${calculateAge(profile.dob)} ${tCommon("yrs")}`
    : "";
  const genderLabel = profile?.gender
    ? getEnumLabel(profile.gender, GENDER_OPTIONS)
    : "";

  if (isLoading) {
  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
        <div className="md:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gold/20 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gold/10">
              <div className="w-10 h-10 rounded-xl bg-gold/10 animate-pulse" />
              <div className="h-5 w-32 bg-gold/10 rounded animate-pulse" />
            </div>
            <div className="space-y-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row py-2 sm:py-1.5 border-b border-gold/10 last:border-0 sm:items-baseline gap-1 sm:gap-0">
                  <div className="h-4 w-24 bg-gold/10 rounded animate-pulse sm:w-[160px]" />
                  <span className="hidden sm:inline-block w-6 text-center" />
                  <div className="h-4 w-3/4 bg-gold/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gold/20 p-4">
            <div className="w-full aspect-square rounded-xl bg-gold/10 animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
      <div className="md:col-span-8">
        <SectionCard3D>
          <SectionHeaderRedesigned
            title={tCommon("basic_info")}
            icon={<Info size={16} />}
            gradient="bg-rosewood-gradient text-white"
            isTamil={isTamil}
          >
            {(() => {
              if (!isOwner) return null;
              const a = profile.adminVerified?.toLowerCase();
              const s = profile.status;
              const statusTag = (gradient: string, label: string) => (
                <span className={`${gradient} text-[9px] sm:text-[10px] font-bold rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 shadow-sm whitespace-nowrap`}>{label}</span>
              );
              if (s === "BLOCKED") return statusTag("bg-rosewood-gradient text-white", tCommon("adminMatrimony:common.blocked"));
              if (s === "SUSPENDED") return statusTag("bg-rosewood-gradient text-white", tCommon("adminMatrimony:common.suspended"));
              if (s === "INACTIVE") return statusTag("bg-rosewood-gradient text-white", tCommon("profile.status.inactive"));
              if (a === "rejected") return statusTag("bg-rosewood-gradient text-white", tCommon("adminMatrimony:common.rejected"));
              if (a === "pending") return statusTag("bg-ivory-gold-gradient", tCommon("pending"));
              if (a === "accepted") return statusTag("bg-ivory-gold-gradient", tCommon("verified"));
              return null;
            })()}
          </SectionHeaderRedesigned>
          <div className="space-y-0">
            <DetailRow
              label={t("profile_new:full_name")}
              value={name}
            />
            <DetailRow
              label={tCommon("profile.reg_no")}
              value={profile?.regNo}
            />
            <DetailRow
              label={t("profile_new:dob")}
              value={profile?.dob ? formatDate(profile.dob) : ""}
            />
            <DetailRow
              label={tCommon("profile.age")}
              value={profile?.dob ? `${calculateAge(profile.dob)} ${tCommon("yrs")}` : ""}
            />
            <DetailRow
              label={t("profile_new:gender")}
              value={profile?.gender ? getEnumLabel(profile.gender, GENDER_OPTIONS) : ""}
            />
            <DetailRow
              label={t("profile_new:current_location")}
              value={currentLocation}
            />
          </div>
        </SectionCard3D>
      </div>
        <div className="md:col-span-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gold/20 flex flex-col items-center">
          <div className="w-full max-w-56 sm:max-w-none aspect-square rounded-xl overflow-hidden border-4 border-ivory bg-ivory">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-ivory flex items-center justify-center">
                <span className="text-rosewood/30 text-4xl font-serif font-bold">
                  {name?.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// StatusReasons — old style banners
// ═══════════════════════════════════════════════════════════
const StatusReasons: React.FC<{ profile: any; isTamil: boolean }> = ({
  profile,
  isTamil,
}) => {
  const { user } = useAuth();
  if (!profile || !user) return null;
  if (!profile.isOwner && profile.userId !== user.id) return null;
  const rejectionReason = profile.rejectionReasonEn;
  const rejectionReasonTa = profile.rejectionReasonTa;
  const blockReason = profile.statusReasonEn;
  const blockReasonTa = profile.statusReasonTa;
  if (!rejectionReason && !blockReason) return null;
  return (
    <div className="space-y-3">
      {rejectionReason && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-red-500" />
            <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
              {isTamil ? "நிராகரிப்பு காரணம்" : "Rejection Reason"}
            </p>
          </div>
          <p className="text-sm font-bold text-red-800 ml-7">
            {isTamil && rejectionReasonTa ? rejectionReasonTa : rejectionReason}
          </p>
        </div>
      )}
      {blockReason && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-amber-500" />
            <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
              {isTamil ? "தடை காரணம்" : "Block Reason"}
            </p>
          </div>
          <p className="text-sm font-bold text-amber-800 ml-7">
            {isTamil && blockReasonTa ? blockReasonTa : blockReason}
          </p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewPersonal
// ═══════════════════════════════════════════════════════════
const ProfileViewPersonal: React.FC<{ profile: any; isLoading: boolean }> = ({
  profile,
  isLoading,
}) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const isTamil = i18n.language === "ta";
  const { getEnumLabel } = useProfileUtils();

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={tCommon("personal_info")}
        icon={<User size={16} />}
        gradient="bg-rosewood-gradient text-white"
        isLoading={isLoading}
        isTamil={isTamil}
      />
      <div className="space-y-0">
        <DetailRow
          label={tCommon("profile_new:profile_for")}
          value={
            profile?.profileFor
              ? getEnumLabel(profile.profileFor, PROFILE_FOR_OPTIONS)
              : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={tCommon("profile_new:marital_status")}
          value={
            profile?.maritalStatus
              ? getEnumLabel(profile.maritalStatus, MARITAL_STATUS_OPTIONS)
              : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={tCommon("profile_new:diet")}
          value={profile?.diet ? getEnumLabel(profile.diet, DIET_OPTIONS) : ""}
          isLoading={isLoading}
        />
        <DetailRow
          label={tCommon("profile_new:height")}
          value={
            profile?.height
              ? getEnumLabel(profile.height.toString(), HEIGHT_OPTIONS)
              : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={tCommon("profile_new:weight")}
          value={profile?.weight ? `${profile.weight} kg` : ""}
          isLoading={isLoading}
        />
        <DetailRow
          label={tCommon("profile_new:complexion")}
          value={
            profile?.complexion
              ? getEnumLabel(profile.complexion, COMPLEXION_OPTIONS)
              : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={tCommon("profile_new:blood_group")}
          value={
            profile?.bloodGroup
              ? getEnumLabel(profile.bloodGroup, BLOOD_GROUP_OPTIONS)
              : ""
          }
          isLoading={isLoading}
        />
      </div>
    </SectionCard3D>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewCommunity
// ═══════════════════════════════════════════════════════════
const ProfileViewCommunity: React.FC<{
  profile: any;
  isLoading: boolean;
}> = ({ profile, isLoading }) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const { t, getEnumLabel, getLocationLabel } = useProfileUtils();

  const isTamil = i18n.language === "ta";
  const getCommunityLabel = () => {
    if (!profile) return "";
    const comm = profile.community || "Kongu Vellalar";
    if (
      isTamil &&
      (comm === "Kongu Vellalar" ||
        comm === "கொங்கு வேளாளர்" ||
        comm === "கொங்கு வெள்ளாளர்")
    )
      return "கொங்கு வேளாளர்";
    return comm;
  };

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t("profile_new:sections.community_details")}
        icon={<Users size={16} />}
        gradient="bg-ivory-gold-gradient text-rosewood"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      <div className="space-y-0">
        <DetailRow
          label={t("profile_new:caste")}
          value={profile?.caste || "BC"}
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:community")}
          value={getCommunityLabel()}
          isLoading={isLoading}
        />
        <DetailRow
          label={isTamil ? "குலம்" : "Kulam"}
          value={
            profile?.kulam ? getEnumLabel(profile.kulam, KULAM_OPTIONS) : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:kuladeivam")}
          value={
            profile
              ? (isTamil
                  ? profile.kuladeivamTa || profile.kuladeivamEn
                  : profile.kuladeivamEn) || ""
              : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:birth_place")}
          value={
            profile
              ? (isTamil
                  ? profile.birthPlaceTa || profile.birthPlaceEn
                  : profile.birthPlaceEn) || ""
              : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:native_location")}
          value={
            profile
              ? getLocationLabel(
                  profile.nativeDistrictEn || profile.nativeDistrict,
                  profile.nativeTaluk || undefined,
                  profile.nativeDistrictTa,
                  profile.nativeTalukTa,
                )
              : ""
          }
          isLoading={isLoading}
        />
      </div>
    </SectionCard3D>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewProfessional
// ═══════════════════════════════════════════════════════════
const ProfileViewProfessional: React.FC<{
  profile: any;
  isLoading: boolean;
}> = ({ profile, isLoading }) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const { t, getEnumLabel, formatSalary } = useProfileUtils();

  const isTamil = i18n.language === "ta";
  const education = profile?.education || tCommon("profile.not_specified");
  const jobDetail = profile?.jobDetail || tCommon("profile.not_specified");
  const jobLocation = profile
    ? (isTamil
        ? profile.jobLocationTa || profile.jobLocationEn
        : profile.jobLocationEn) || ""
    : "";

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t("profile_new:sections.professional_details")}
        icon={<Briefcase size={16} />}
        gradient="bg-rosewood-gradient text-white"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
        <DetailRow
          label={t("profile_new:education")}
          value={education}
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:job_detail")}
          value={jobDetail}
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:company_name")}
          value={profile?.companyName || ""}
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:job_sector")}
          value={
            profile?.jobSector
              ? getEnumLabel(profile.jobSector, JOB_SECTOR_OPTIONS)
              : ""
          }
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:job_location")}
          value={jobLocation}
          isLoading={isLoading}
        />
        <DetailRow
          label={t("profile_new:salary_monthly")}
          value={
            profile?.salaryMonthly ? formatSalary(profile.salaryMonthly) : ""
          }
          isLoading={isLoading}
        />
      </div>
    </SectionCard3D>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewFamily
// ═══════════════════════════════════════════════════════════
const ProfileViewFamily: React.FC<{ profile: any; isLoading: boolean }> = ({
  profile,
  isLoading,
}) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const { t, formatSalary } = useProfileUtils();

  const isTamil = i18n.language === "ta";
  const fatherNameRaw = profile
    ? (isTamil
        ? profile.fatherNameTa || profile.fatherNameEn
        : profile.fatherNameEn) || tCommon("not_provided")
    : "";
  const motherNameRaw = profile
    ? (isTamil
        ? profile.motherNameTa || profile.motherNameEn
        : profile.motherNameEn) || tCommon("not_provided")
    : "";
  const lateSuffix = ` (${t("profile_new:is_late")})`;
  const fatherName = profile?.fatherIsLate
    ? `${fatherNameRaw}${lateSuffix}`
    : fatherNameRaw;
  const motherName = profile?.motherIsLate
    ? `${motherNameRaw}${lateSuffix}`
    : motherNameRaw;

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t("profile_new:sections.family_details")}
        icon={<Heart size={16} />}
        gradient="bg-ivory-gold-gradient text-rosewood"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
        <div>
          <h3 className="font-semibold text-rosewood text-sm mt-1 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? (
          <div className="h-4 w-28 bg-gold/10 rounded animate-pulse" />
        ) : (
          `${t("profile_new:father_details_label")}:`
            )}
          </h3>
          <DetailRow
            label={t("profile_new:father_name")}
            value={fatherName}
            isLoading={isLoading}
          />
          <DetailRow
            label={t("profile_new:father_job")}
            value={profile?.fatherJob || ""}
            isLoading={isLoading}
          />
          <DetailRow
            label={tCommon("salary_monthly")}
            value={profile?.fatherSalary ? formatSalary(profile.fatherSalary) : ""}
            isLoading={isLoading}
          />
          <h3 className="font-semibold text-rosewood text-sm mt-5 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? (
              <div className="h-4 w-24 bg-gold/10 rounded animate-pulse" />
            ) : (
              `${t("profile_new:sections.siblings")}:`
            )}
          </h3>
          <DetailRow
            label={t("profile_new:no_of_brothers")}
            value={profile?.noOfBrothers ?? 0}
            isLoading={isLoading}
          />
        </div>
        <div>
          <h3 className="font-semibold text-rosewood text-sm mt-1 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? (
              <div className="h-4 w-24 bg-gold/10 rounded animate-pulse" />
            ) : (
              `${t("profile_new:mother_details_label")}:`
            )}
          </h3>
          <DetailRow
            label={t("profile_new:mother_name")}
            value={motherName}
            isLoading={isLoading}
          />
          <DetailRow
            label={t("profile_new:mother_job")}
            value={profile?.motherJob || ""}
            isLoading={isLoading}
          />
          <DetailRow
            label={tCommon("salary_monthly")}
            value={profile?.motherSalary ? formatSalary(profile.motherSalary) : ""}
            isLoading={isLoading}
          />
          <h3 className="font-semibold text-rosewood text-sm mt-5 mb-2 border-b border-rosewood/10 pb-1">
            {isLoading ? (
              <div className="h-4 w-24 bg-gold/10 rounded animate-pulse" />
            ) : (
              `${t("profile_new:sections.siblings")}:`
            )}
          </h3>
          <DetailRow
            label={t("profile_new:no_of_sisters")}
            value={profile?.noOfSisters ?? 0}
            isLoading={isLoading}
          />
        </div>
      </div>
    </SectionCard3D>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewAssets
// ═══════════════════════════════════════════════════════════
const ProfileViewAssets: React.FC<{
  profile: any;
  isLoading: boolean;
}> = ({ profile, isLoading }) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const { t, getEnumLabel } = useProfileUtils();

  const isTamil = i18n.language === "ta";
  const property = profile
    ? (isTamil
        ? profile.propertyDetailsTa || profile.propertyDetailsEn
        : profile.propertyDetailsEn) || ""
    : "";
  const expectations = profile
    ? (isTamil
        ? profile.expectationTa || profile.expectationEn
        : profile.expectationEn) || ""
    : "";

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t("profile_new:sections.assets_and_expectations")}
        icon={<Building2 size={16} />}
        gradient="bg-rosewood-gradient text-white"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
        <div>
          <DetailRow
            label={t("profile_new:residence")}
            value={
              profile?.residence
                ? getEnumLabel(profile.residence, RESIDENCE_OPTIONS)
                : ""
            }
            isLoading={isLoading}
          />
          <DetailRow
            label={t("profile_new:property_details")}
            value={property || "-"}
            isLoading={isLoading}
          />
        </div>
        <div>
          <DetailRow
            label={t("profile_new:expectation")}
            value={expectations || "-"}
            isLoading={isLoading}
          />
        </div>
      </div>
    </SectionCard3D>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewHoroscope
// ═══════════════════════════════════════════════════════════
const ProfileViewHoroscope: React.FC<{ profile: any; isLoading: boolean }> = ({
  profile,
  isLoading,
}) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const lang = i18n.language as "en" | "ta";
  const isTamil = i18n.language === "ta";
  const { t, getEnumLabel } = useProfileUtils();

  const natchathiram = profile?.star
    ? getBilingualValue(NAKSHATRA_OPTIONS, profile.star, lang)
    : "";
  const rasiLabel = profile?.rasi
    ? getBilingualValue(RASI_OPTIONS, profile.rasi, lang)
    : "";
  const lagnam = profile?.laganam
    ? getBilingualValue(RASI_OPTIONS, profile.laganam, lang)
    : "";
  const dosham = profile?.dosham
    ? getEnumLabel(profile.dosham, DOSHAM_OPTIONS)
    : "";
  const hasCharts =
    profile?.horoscope && (profile.horoscope.rasi || profile.horoscope.navamsa);

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t("profile_new:sections.horoscope_details")}
        icon={<Map size={16} />}
        gradient="bg-ivory-gold-gradient text-rosewood"
        isTamil={isTamil}
        isLoading={isLoading}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 mb-8">
        <DetailRow label={t("profile_new:star")} value={natchathiram} isLoading={isLoading} />
        <DetailRow label={t("profile_new:rasi")} value={rasiLabel} isLoading={isLoading} />
        <DetailRow label={t("profile_new:laganam")} value={lagnam} isLoading={isLoading} />
        <DetailRow label={t("profile_new:dosham")} value={dosham} isLoading={isLoading} />
      </div>
      {isLoading || hasCharts ? (
        <div className="mt-8 pt-8 border-t border-gold/20">
          <h3 className="text-sm font-bold text-rosewood uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-gold">auto_awesome</span>
            {t("profile_new:horoscope.charts")}
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gold/10 rounded-xl animate-pulse" />
              <div className="aspect-square bg-gold/10 rounded-xl animate-pulse" />
            </div>
          ) : profile?.horoscope?.mode === "CREATE" ? (
            (() => {
              const hJson = profile?.horoscope?.horoscopeJson;
              if (hJson) {
                const parsed = typeof hJson === 'string' ? JSON.parse(hJson) : hJson as HoroscopeResult;
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div whileHover={{ scale: 1.01, rotateY: -1 }} className="perspective-1000 preserve-3d">
                      <D1Chart lagnaSign={parsed.lagna.signIndex} planets={parsed.planets} />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.01, rotateY: -1 }} className="perspective-1000 preserve-3d">
                      <D9Chart planets={parsed.planets} lagnaNavamsaSignIndex={parsed.lagnaNavamsa.signIndex} />
                    </motion.div>
                  </div>
                );
              }
              return null;
            })()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile?.horoscope?.rasi && (
                <motion.div whileHover={{ scale: 1.01, rotateY: -1 }} className="perspective-1000 preserve-3d group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                  <img src={typeof profile.horoscope.rasi === "string" ? getImageUrl(profile.horoscope.rasi) || "" : ""} alt="Rasi" className="w-full h-full object-contain p-4" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-rosewood/90 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg">{t("profile_new:horoscope.rasi_chart_label")}</span>
                  </div>
                </motion.div>
              )}
              {profile?.horoscope?.navamsa && (
                <motion.div whileHover={{ scale: 1.01, rotateY: -1 }} className="perspective-1000 preserve-3d group relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                  <img src={typeof profile.horoscope.navamsa === "string" ? getImageUrl(profile.horoscope.navamsa) || "" : ""} alt="Navamsa" className="w-full h-full object-contain p-4" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-rosewood/90 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg">{t("profile_new:horoscope.navamsa_chart_label")}</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 p-6 bg-white rounded-xl border border-gold/20 text-center">
          <p className="text-sm text-slate-400 italic font-medium">{t("profile_new:horoscope.no_chart_provided")}</p>
        </div>
      )}
    </SectionCard3D>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileViewGallery
// ═══════════════════════════════════════════════════════════
const ProfileViewGallery: React.FC<{
  profile: any;
  isLoading: boolean;
}> = ({ profile, isLoading }) => {
  const { t: tCommon, i18n } = useTranslation(["common"]);
  const isTamil = i18n.language === "ta";
  const { t } = useTranslation(["profile_new"]);

  const galleryImages = (profile?.gallery || []).filter((url: string) => !!url);

  if (!isLoading && galleryImages.length === 0) return null;

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t("profile_new:sections.lifestyle_glimpses")}
        icon={<Camera size={16} />}
        gradient="bg-rosewood-gradient text-white"
        isLoading={isLoading}
        isTamil={isTamil}
      />
      {(() => {
        if (isLoading) {
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-4/5 rounded-2xl bg-gold/10 animate-pulse" />
              ))}
            </div>
          );
        }
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-4">
            {galleryImages.map((url: string, i: number) => (
              <motion.div
                key={i}
                whileHover={{ rotateY: -2, scale: 1.02 }}
                className="perspective-1000 preserve-3d aspect-4/5 rounded-2xl overflow-hidden border border-gold/20 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-gold/10 transition-shadow duration-300 group bg-white relative"
              >
                <img
                  src={getImageUrl(url) ?? ""}
                  alt={`${t("profile_new:gallery")} ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                  <span className="material-symbols-outlined text-white text-2xl">
                    zoom_in
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        );
      })()}
    </SectionCard3D>
  );
};

// ═══════════════════════════════════════════════════════════
// ProfileView (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const ProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["common"]);
  const isTamil = i18n.language === "ta";
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  useEffect(() => { if (id) { stubFetchProfile(id).then(setProfile).catch(() => setIsError(true)).finally(() => setIsLoading(false)); } }, [id]);

  const [isPrintingJathagam, setIsPrintingJathagam] = useState(false);
  const [isPrintingBiodata, setIsPrintingBiodata] = useState(false);

  const userGalleryImages = (profile?.gallery || []).filter((url: string) => !!url);
  const hasUserGalleryContent = isLoading || userGalleryImages.length > 0;

  useEffect(() => {
    if (isPrintingJathagam && profile) {
      document.body.classList.add("printing-jathagam");
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintingJathagam, profile]);

  useEffect(() => {
    if (isPrintingJathagam) {
      const handler = () => {
        setIsPrintingJathagam(false);
        document.body.classList.remove("printing-jathagam");
      };
      window.addEventListener("afterprint", handler);
      return () => window.removeEventListener("afterprint", handler);
    }
  }, [isPrintingJathagam]);

  useEffect(() => {
    if (isPrintingBiodata && profile) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintingBiodata, profile]);

  useEffect(() => {
    if (isPrintingBiodata) {
      const handler = () => setIsPrintingBiodata(false);
      window.addEventListener("afterprint", handler);
      return () => window.removeEventListener("afterprint", handler);
    }
  }, [isPrintingBiodata]);

  const handlePrintJathagam = () => {
    setIsPrintingJathagam(true);
  };

  if (isPrintingJathagam && profile) {
    return <JathagamPrintView profile={profile} />;
  }

  if (isPrintingBiodata && profile) {
    return <PrintProfile profile={profile} />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-rosewood/5 flex items-center justify-center mx-auto mb-6">
            <span className="text-rosewood/30 text-2xl font-serif font-bold">!</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-rosewood mb-2">
            {t("common:profile_not_found")}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {t("common:profile_not_found_desc", {
              defaultValue: "This profile may have been removed.",
            })}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-rosewood text-white rounded-xl font-black text-xs uppercase tracking-widest-plus hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rosewood/20"
          >
            {t("common:back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-manrope selection:bg-gold/20">
      {/* Section Tabs — sticky below layout header, full-width bar, negate parent p-4 top padding */}
      <div className="sticky top-0 z-20 relative -mt-4 lg:-mt-8">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen bg-white border-b border-gold/10 shadow-sm pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <QuickNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="no-print max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        {/* Back + Print Buttons */}
        <div className="flex items-center justify-between pt-4 sm:pt-6 pb-4 sm:pb-8 gap-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2
                       bg-ivory-gold-gradient rounded-xl text-[10px] sm:text-xs
                       font-black uppercase tracking-wider shadow-sm btn-shine shrink-0"
          >
            <ArrowLeft size={14} className="sm:size-4" />
            <span className="hidden sm:inline">{t("common:back")}</span>
          </motion.button>

          {profile && (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrintJathagam}
                className="btn-shine flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2
                           bg-rosewood-gradient text-white rounded-xl text-[10px] sm:text-[11px]
                           font-bold shadow-sm border border-rosewood/20 shrink-0"
              >
                <FileText size={13} className="sm:size-[14px]" />
                <span className="hidden sm:inline">{t("common:print_jathagam")}</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPrintingBiodata(true)}
                className="btn-shine flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2
                            bg-rosewood-gradient text-white rounded-xl text-[10px] sm:text-[11px]
                            font-bold shadow-sm border border-rosewood/20 shrink-0"
              >
                <Printer size={13} className="sm:size-[14px]" />
                <span className="hidden sm:inline">{t("common:print")}</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Hero */}
        <AnimatedSection>
          <div id="section-basic" className="scroll-mt-20 mb-6">
            <ProfileViewHeader profile={profile} isLoading={isLoading} />
          </div>
        </AnimatedSection>

        {/* Rejection / Block reasons */}
        <AnimatedSection>
          <div className="mb-6">
            <StatusReasons profile={profile} isTamil={isTamil} />
          </div>
        </AnimatedSection>

        {/* Sections 1 + 2: Personal + Community */}
        <AnimatedSection>
          <div id="section-personal" className="scroll-mt-20 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <ProfileViewPersonal profile={profile} isLoading={isLoading} />
            <ProfileViewCommunity
              profile={profile}
              isLoading={isLoading}
            />
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 3: Professional */}
        <AnimatedSection>
          <div id="section-professional" className="scroll-mt-20">
            <ProfileViewProfessional
              profile={profile}
              isLoading={isLoading}
            />
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 4: Family */}
        <AnimatedSection>
          <div id="section-family" className="scroll-mt-20">
            <ProfileViewFamily profile={profile} isLoading={isLoading} />
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 5: Assets */}
        <AnimatedSection>
          <div id="section-assets" className="scroll-mt-20">
            <ProfileViewAssets
              profile={profile}
              isLoading={isLoading}
            />
          </div>
        </AnimatedSection>
        <SectionDivider />

        {/* Section 6: Horoscope */}
        <AnimatedSection>
          <div id="section-horoscope" className="scroll-mt-20">
            <ProfileViewHoroscope profile={profile} isLoading={isLoading} />
          </div>
        </AnimatedSection>
        {hasUserGalleryContent && (
          <>
            <SectionDivider />

            {/* Section 7: Gallery */}
            <AnimatedSection>
              <div id="section-gallery" className="scroll-mt-20 mb-6">
                <ProfileViewGallery
                  profile={profile}
                  isLoading={isLoading}
                />
              </div>
            </AnimatedSection>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
