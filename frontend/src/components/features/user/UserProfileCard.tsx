import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  MoreVertical,
  Eye,
  EyeOff,
  Check,
  X,
  Edit2,
  Settings,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LazyImage } from "@/components/ui/atoms/LazyImage";
import { useTranslations } from "@/hooks/useTranslations";
import { useProfileUtils } from "@/hooks/useProfileUtils";
import { KULAM_OPTIONS } from "@/constants/options";
import { StatusBadge } from "@/components/ui/feedback/StatusBadge";
import { useInitials } from "@/hooks/useInitials";
import { stubToggleShortlist } from '@/utils/stubs';
import { formatFullName } from "@/utils/formatName";

interface UserProfileCardProps {
  profile: any;
  variant?: "default" | "browse" | "myprofiles" | "shortlist";
  isOwnProfile?: boolean;
  onToggleShortlist?: (id: string, isShortlisted: boolean) => void;
  onToggleStatus?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = React.memo(
  ({
    profile,
    variant = "default",
    isOwnProfile,
    onToggleShortlist,
    onToggleStatus,
    onDelete,
    onComplete,
  }) => {
    const { t, i18n } = useTranslations([
      "common",
      "profile_new",
      "myprofiles",
    ]);
    const { getEnumLabel, getLocationLabel } = useProfileUtils();
    const navigate = useNavigate();
    const isOwner = isOwnProfile || profile.isOwner;
    const [isShortlisted, setIsShortlisted] = React.useState(
      !!profile.isShortlisted,
    );
    const [isToggling, setIsToggling] = React.useState(false);
    const [shortlistPending, setShortlistPending] = React.useState(false);

    const { getInitials } = useInitials();
    const isTamil = i18n.language === "ta";

    const fullName = isTamil
      ? formatFullName(profile.firstNameTa, profile.lastNameTa) || formatFullName(profile.owner?.firstNameTa, profile.owner?.lastNameTa) || profile.name
      : formatFullName(profile.firstNameEn, profile.lastNameEn) || formatFullName(profile.owner?.firstNameEn, profile.owner?.lastNameEn) || profile.name;

    const kuladeivam = isTamil
      ? profile.kuladeivamTa || "குறிப்பிடப்படவில்லை"
      : profile.kuladeivamEn || "Not specified";

    const currentLocation = getLocationLabel(
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
    );
    const profession =
      profile.profession || profile.jobDetail || profile.jobSector;
    const regNo = profile.regNo || profile.id;
    const profilePhoto =
      profile.profilePhoto ||
      profile.photo ||
      (profile.photos && profile.photos[0]);

    const getCommunityLabel = () => {
      const comm = profile.community || "Kongu Vellalar";
      if (
        isTamil &&
        (comm === "Kongu Vellalar" ||
          comm === "கொங்கு வேளாளர்" ||
          comm === "கொங்கு வெள்ளாளர்")
      ) {
        return "கொங்கு வேளாளர்";
      }
      return comm;
    };
    const community = getCommunityLabel();

    const age =
      profile.age ||
      (profile.dob
        ? new Date().getFullYear() - new Date(profile.dob).getFullYear()
        : t("common:not_provided"));

    const toggleShortlist = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isToggling) return;

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error(t("common:login_required"));
        return;
      }

      setIsToggling(true);
      const previousState = isShortlisted;
      setIsShortlisted(!previousState);

      try {
        setShortlistPending(true);
        await stubToggleShortlist({ profileId: profile.id }).finally(() => setShortlistPending(false));
        const newState = !previousState;
        setIsShortlisted(newState);

        if (newState) {
          toast.success(t("common:shortlisted_success"));
        } else {
          toast.info(t("common:removed_shortlist"));
        }

        if (onToggleShortlist) {
          onToggleShortlist(profile.id, newState);
        }
      } catch (error: any) {
        setIsShortlisted(previousState);
        toast.error(t("common:error_shortlist"));
      } finally {
        setIsToggling(false);
      }
    };

    const renderPlaceholderImage = () => {
      const fontSize =
        fullName.length > 24 ? 8 : fullName.length > 16 ? 10 : 12;
      return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="200" height="250" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="paint0_linear" x1="0" y1="0" x2="200" y2="250" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FCF9F2" />
                        <stop offset="1" stop-color="#F5EFE1" />
                    </linearGradient>
                    <clipPath id="cardClip">
                        <rect width="200" height="250" rx="14" />
                    </clipPath>
                </defs>
                <rect width="200" height="250" fill="url(#paint0_linear)" />
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b0028" fill-opacity="0.4" font-family="${isTamil ? "'Noto Sans Tamil', sans-serif" : "serif"}" font-weight="900" font-size="${fontSize}" transform="rotate(-45 100 125)" letter-spacing="0" clip-path="url(#cardClip)">
                    ${fullName}
                </text>
                <rect x="10" y="10" width="180" height="230" rx="10" stroke="#D4AF37" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.3"/>
            </svg>
        `)}`;
    };

    const resolveImageUrl = (url: string | null | undefined) => {
      return (url && /^https?:\/\//i.test(url)) ? url : renderPlaceholderImage();
    };

    const handleViewProfile = () => {
      navigate(`/manamaalai/view-profile/${profile.id}`);
    };

    return (
      <div className="p-3.5 rounded-xl shadow-sm flex flex-col md:flex-row gap-5 bg-white border border-gold/10 hover:border-gold/40 hover:shadow-xl transition-all duration-500 relative group overflow-hidden">
        {/* Top Right Action Area */}
        <div className="absolute top-3 right-3 z-30 flex gap-2">
          {!isOwner && (
            <button
              onClick={toggleShortlist}
              disabled={isToggling}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isShortlisted
                  ? "bg-linear-to-br from-rosewood/95 via-dark-rosewood/95 to-rosewood/95 text-ivory/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_4px_8px_rgba(107,0,40,0.4)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_6px_12px_rgba(107,0,40,0.5)] transform hover:-translate-y-0.5 border border-rosewood/50"
                  : "bg-linear-to-br from-ivory to-gold/40 text-rosewood shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_4px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 border border-gold/10"
              } ${isToggling ? "opacity-50" : ""}`}
              title={
                isShortlisted
                  ? t("common:removed_shortlist")
                  : t("common:add_shortlist")
              }
            >
              <span
                className={`material-symbols-outlined text-[20px]! transition-all duration-300 transition-variation ${isShortlisted ? 'font-variation-fill' : ""}`}
              >
                favorite
              </span>
            </button>
          )}

          {isOwner && (
            <div className="flex gap-2">
              {profile.status === "DRAFT"
                ? onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(profile.id);
                      }}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center transition-all duration-300 shadow-md text-red-500 hover:scale-110"
                      title={t("common:delete")}
                    >
                      <Trash2 size={18} />
                    </button>
                  )
                : onToggleStatus &&
                  profile.adminVerified === "ACCEPTED" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus =
                          profile.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                        onToggleStatus(profile.id, newStatus);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 shadow-sm border ${
                        profile.status === "ACTIVE" 
                          ? "bg-ivory-gold-gradient hover:shadow-gold/20" 
                          : "bg-rosewood-gradient hover:shadow-rosewood/30"
                      }`}
                      title={
                        profile.status === "ACTIVE"
                          ? t("myprofiles:deactivate")
                          : t("myprofiles:activate")
                      }
                    >
                      {profile.status === "ACTIVE" ? (
                        <Eye size={18} strokeWidth={2.5} />
                      ) : (
                        <EyeOff size={18} strokeWidth={2.5} />
                      )}
                    </button>
                  )}
            </div>
          )}
        </div>

        {/* Profile Photo Area */}
        <div className="w-40 md:w-44 aspect-3/4 rounded-xl overflow-hidden shrink-0 border-2 border-gold/20 p-0.5 bg-ivory shadow-lg relative mx-auto md:mx-0">
          <LazyImage
            alt={fullName}
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-700 ease-out"
            src={resolveImageUrl(profilePhoto)}
          />
          <div className="absolute inset-0 kolam-watermark opacity-10 pointer-events-none"></div>
        </div>

        {/* Profile Context Area */}
        <div className="flex-1 flex flex-col min-w-0 py-1 pe-2 text-left">
          <div className="mb-3">
            <h3
              className={`text-xl font-bold text-rosewood truncate ${isTamil ? "font-sans" : "font-serif"}`}
              title={fullName}
            >
              {fullName}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className="text-[11px] text-gold font-bold">{regNo}</span>
              <div className="flex items-center gap-2">
                {profile.status === "DRAFT" ? (
                  <StatusBadge status="draft" minimal />
                ) : (
                  <>
                    {variant !== "browse" &&
                      profile.adminVerified !== "ACCEPTED" && (
                        <StatusBadge
                          status={
                            profile.adminVerified?.toLowerCase() || "pending"
                          }
                          minimal
                        />
                      )}
                    {profile.status === "INACTIVE" && (
                      <StatusBadge status="inactive" minimal />
                    )}
                  </>
                )}
              </div>
              {profile.adminVerified === "REJECTED" &&
                profile.rejectionReasonEn && (
                  <p className="text-[10px] text-rosewood font-medium mt-1 line-clamp-1">
                    {profile.rejectionReasonEn}
                  </p>
                )}
              {profile.status === "INACTIVE" && profile.statusReasonEn && (
                <p className="text-[10px] text-amber-600 font-medium mt-1 line-clamp-1">
                  {profile.statusReasonEn}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              {
                label: t("common:profile.age"),
                value: `${age} ${t("common:yrs")}`,
              },
              {
                label: t("common:Education"),
                value: profile.education || t("common:profile.not_specified"),
              },
              { label: t("common:Community"), value: community },
              {
                label: t("common:profile.job"),
                value: profession || t("common:profile.not_specified"),
              },
              {
                label: t("common:profile.location"),
                value: currentLocation || t("common:profile.not_specified"),
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-baseline text-xs">
                <span
                  className="w-28 text-rosewood/80 font-semibold text-[11px] shrink-0 truncate"
                  title={item.label}
                >
                  {item.label}
                </span>
                <span
                  className={`text-slate-600 truncate flex-1 leading-tight ${isTamil ? "font-semibold" : "font-bold"}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-gold/5">
            <div
              onClick={(e) => {
                if (profile.status === "DRAFT" && onComplete) {
                  e.stopPropagation();
                  onComplete(profile.id);
                } else {
                  handleViewProfile();
                }
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-br from-ivory to-gold/40 text-rosewood shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.05)] border border-gold/10 transition-all duration-500 cursor-pointer group/btn
                hover:bg-linear-to-br hover:from-rosewood/80 hover:via-dark-rosewood/95 hover:to-rosewood/80 hover:text-white hover:border-rosewood/50 hover:shadow-lg hover:shadow-rosewood/20 hover:-translate-y-0.5
                ${variant === 'shortlist' ? 'group-hover:bg-linear-to-br group-hover:from-rosewood/95 group-hover:via-dark-rosewood/95 group-hover:to-rosewood/95 group-hover:text-white group-hover:border-rosewood/50' : ''}
              `}
            >
              <Eye className="w-3.5 h-3.5 text-current group-hover/btn:scale-110 transition-transform duration-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {profile.status === "DRAFT"
                  ? t("common:profile.action.complete")
                  : t("common:profile.action.view_details")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

UserProfileCard.displayName = "UserProfileCard";

// ═══════════════════════════════════════════════════════════
// UserProfileCardSkeleton – matches card design exactly
// ═══════════════════════════════════════════════════════════

export const UserProfileCardSkeleton: React.FC = () => (
  <div className="p-3.5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-5 bg-white border border-gold-500/10 relative group overflow-hidden">
    <div className="w-40 md:w-44 aspect-3/4 rounded-xl overflow-hidden shrink-0 border-2 border-gold-500/10 p-0.5 bg-ivory relative mx-auto md:mx-0">
      <div className="w-full h-full rounded-[14px] skeleton" />
    </div>
    <div className="flex-1 flex flex-col min-w-0 py-1 pe-2 text-left">
      <div className="mb-3">
        <div className="h-7 w-48 skeleton rounded-lg!" />
        <div className="flex items-center gap-2 mt-1.5">
          <div className="h-3 w-20 skeleton" />
          <div className="h-4 w-16 skeleton" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-baseline text-xs">
            <div className="w-28 h-3 skeleton shrink-0" />
            <div className="h-3 flex-1 skeleton ms-2" />
          </div>
        ))}
      </div>
      <div className="mt-auto pt-3 border-t border-gold-500/5">
        <div className="w-full h-10 rounded-xl skeleton bg-gold-500/10!" />
      </div>
    </div>
  </div>
);
