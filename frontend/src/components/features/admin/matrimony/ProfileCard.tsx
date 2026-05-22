import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyImage } from '@/components/ui/atoms/LazyImage';
import { useTranslations } from '@/hooks/useTranslations';
import { useProfileUtils } from '@/hooks/useProfileUtils';
import { KULAM_OPTIONS } from '@/constants/options';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { useInitials } from '@/hooks/useInitials';
import { formatFullName } from '@/utils/formatName';
import { getImageUrl } from '@/utils/getImageUrl';

interface AdminActions {
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onView?: (id: string) => void;
}

interface AdminProfileCardProps {
    profile: any;
    adminActions?: AdminActions;
}

export const AdminProfileCard: React.FC<AdminProfileCardProps> = React.memo(({
    profile,
    adminActions,
}) => {
    const { t, i18n } = useTranslations(['common', 'profile_new', 'adminMatrimony']);
    const { getEnumLabel, getLocationLabel } = useProfileUtils();
    const navigate = useNavigate();

    const isTamil = i18n.language === 'ta';

    const fullName = isTamil
        ? formatFullName(profile.firstNameTa, profile.lastNameTa) || formatFullName(profile.firstNameEn, profile.lastNameEn) || profile.name
        : formatFullName(profile.firstNameEn, profile.lastNameEn) || formatFullName(profile.firstNameTa, profile.lastNameTa) || profile.name;

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
        profile.currentCountryTa
    );

    const regNo = profile.regNo || profile.id;
    const profilePhoto = profile.profilePhoto || profile.photo || (profile.photos && profile.photos[0]);

    const createdBy = isTamil ? profile.createdByTa : profile.createdByEn;

    const getCommunityLabel = () => {
        const comm = profile.community || 'Kongu Vellalar';
        if (isTamil && (comm === 'Kongu Vellalar' || comm === 'கொங்கு வேளாளர்' || comm === 'கொங்கு வெள்ளாளர்')) {
            return 'கொங்கு வேளாளர்';
        }
        return comm;
    };

    const community = getCommunityLabel();
    const age = profile.age || (profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : t('common:not_provided'));

    const handleViewProfile = () => {
        if (adminActions?.onView) {
            adminActions.onView(profile.id);
        } else {
            navigate(`/admin/matrimony/profiles/${profile.id}`);
        }
    };

    const renderPlaceholderImage = () => {
        const fontSize = fullName.length > 24 ? 12 : fullName.length > 16 ? 16 : 20;
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
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b0028" fill-opacity="0.4" font-family="${isTamil ? "'Noto Sans Tamil', sans-serif" : 'serif'}" font-weight="900" font-size="${fontSize}" transform="rotate(-45 100 125)" letter-spacing="0" clip-path="url(#cardClip)">
                    ${fullName}
                </text>
                <rect x="10" y="10" width="180" height="230" rx="10" stroke="#D4AF37" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.3"/>
            </svg>
        `)}`;
    };

    const resolveImageUrl = (url: string | null | undefined) => {
        return getImageUrl(url) || renderPlaceholderImage();
    };

    return (
        <div className="p-3.5 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-5 bg-white border border-gold/10 hover:border-gold/30 hover:shadow-xl transition-all duration-500 relative group overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Status Badge - Top Right */}
            <div className="absolute top-4 right-4 z-20">
                <StatusBadge status={(profile.status || 'PENDING').toLowerCase() as any} minimal />
            </div>

            {/* Profile Photo Area */}
            <div className="w-40 md:w-44 aspect-3/4 rounded-2xl overflow-hidden shrink-0 border-2 border-gold/20 p-0.5 bg-ivory shadow-lg relative mx-auto sm:mx-0 z-10">
                <LazyImage
                    alt={fullName}
                    className="w-full h-full object-cover rounded-[20px] group-hover:scale-105 transition-transform duration-700 ease-out"
                    src={resolveImageUrl(profilePhoto)}
                />
                <div className="absolute inset-0 kolam-watermark opacity-10 pointer-events-none"></div>
            </div>

            {/* Profile Context Area */}
            <div className="flex-1 flex flex-col min-w-0 py-1 pe-2 text-left z-10">
                <div className="mb-3 pr-16"> {/* Added padding-right to avoid overlap with badge */}
                    <h3
                        className={`text-xl font-black text-rosewood truncate ${isTamil ? 'font-sans' : 'font-serif'}`}
                        title={fullName}
                    >
                        {fullName}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className="text-[11px] text-gold font-black tracking-wider uppercase">
                            {regNo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                            {age} {t('common:yrs')}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                    {[
                        { label: t('common:Caste'), value: profile.caste || t('common:profile.not_specified') },
                        { label: t('common:Community'), value: community || t('common:profile.not_specified') },
                        { label: t('common:profile.location'), value: currentLocation || t('common:profile.not_specified') },
                        { label: t('common:Kulam'), value: getEnumLabel(profile.kulam, KULAM_OPTIONS) || t('common:profile.not_specified') },
                        { label: t('common:Kuladeivam'), value: (isTamil ? profile.kuladeivamTa : profile.kuladeivamEn) || t('common:profile.not_specified') },
                        { label: t('adminMatrimony:verification.submittedBy'), value: createdBy || t('common:profile.not_specified') }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-baseline text-xs">
                            <span className="w-24 text-rosewood/60 font-bold text-[10px] uppercase tracking-tight shrink-0 truncate" title={item.label}>{item.label}</span>
                            <span className={`text-slate-700 truncate flex-1 leading-tight ${isTamil ? 'font-bold' : 'font-black'}`}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    {profile.submittedAt && (
                        <div className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold/40"></span>
                            {t('adminMatrimony:verification.submittedOn')}: {new Date(profile.submittedAt).toLocaleDateString()}
                        </div>
                    )}
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-rosewood text-white rounded-xl hover:bg-rosewood/90 hover:shadow-xs hover:shadow-rosewood/20 transition-all font-semibold text-xs "
                    >
                        <Eye size={16} strokeWidth={3} />
                        {t('common:profile.action.view_details') || 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    );
});

AdminProfileCard.displayName = 'AdminProfileCard';
