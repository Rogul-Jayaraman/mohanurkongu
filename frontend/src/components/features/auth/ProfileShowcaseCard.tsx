import React from 'react';
import { LazyImage } from '@/components/ui/atoms/LazyImage';
import { getImageUrl } from '@/utils/getImageUrl';

interface ProfileShowcaseCardProps {
  profile: {
    id: string;
    regNo: string;
    firstNameEn?: string | null;
    lastNameEn?: string | null;
    firstNameTa?: string | null;
    lastNameTa?: string | null;
    profilePhoto?: string | null;
    gender?: string;
  };
  isTamil?: boolean;
}

const renderPlaceholderSVG = (fullName: string, isTamil: boolean) => {
  const fontSize = fullName.length > 20 ? 7 : fullName.length > 12 ? 9 : 11;
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="100%" height="100%" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="300" y2="400" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FCF9F2" />
          <stop offset="1" stop-color="#F5EFE1" />
        </linearGradient>
        <clipPath id="clip">
          <rect width="300" height="400" rx="16" />
        </clipPath>
      </defs>
      <rect width="300" height="400" fill="url(#bg)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b0028" fill-opacity="0.3" font-family="${isTamil ? "'Noto Sans Tamil', sans-serif" : "serif"}" font-weight="900" font-size="${fontSize}" transform="rotate(-45 150 200)" letter-spacing="0" clip-path="url(#clip)">
        ${fullName}
      </text>
      <rect x="10" y="10" width="280" height="380" rx="10" stroke="#D4AF37" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.25"/>
    </svg>
  `)}`;
};

export const ProfileShowcaseCard: React.FC<ProfileShowcaseCardProps> = React.memo(({ profile, isTamil = false }) => {
  const fullName = isTamil
    ? [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') || 'Profile'
    : [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ') || [profile.firstNameTa, profile.lastNameTa].filter(Boolean).join(' ') || 'Profile';

  const imageUrl = getImageUrl(profile.profilePhoto) || renderPlaceholderSVG(fullName, isTamil);

  return (
    <div className="
      w-full
      group
      relative overflow-hidden
      rounded-xl sm:rounded-2xl
      bg-white
      border border-gold/20
      shadow-sm
      hover:border-gold/60
      hover:shadow-xl hover:shadow-gold/5
      hover:-translate-y-1 md:hover:-translate-y-1.5
      transition-all duration-500 ease-out
    ">
      <div className="
        relative overflow-hidden
        aspect-[3/4] sm:aspect-square
      ">
        <div className="absolute inset-0 bg-linear-to-t from-rosewood/5 to-transparent z-[1] pointer-events-none" />

        <LazyImage
          src={imageUrl}
          alt={fullName}
          className="w-full h-full object-cover
            group-hover:scale-105
            transition-transform duration-700 ease-out"
        />

        <div className="absolute inset-0 kolam-watermark opacity-[0.06] pointer-events-none z-[2]" />

      </div>

      <div className="absolute inset-0" data-protected="true" />
    </div>
  );
});

ProfileShowcaseCard.displayName = 'ProfileShowcaseCard';
