import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, User as UserIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { format } from 'date-fns';
import type { AdminAccountProfile, AdminShortlistedProfile } from '@/api/admin-accounts.api';

interface AccountProfileCardProps {
  profile: AdminAccountProfile | AdminShortlistedProfile;
  shortlistedAt?: string;
}

const AccountProfileCard: React.FC<AccountProfileCardProps> = ({ profile, shortlistedAt }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isTamil = language === 'ta';
  const [imgError, setImgError] = useState(false);

  const name = [profile.firstNameEn, profile.lastNameEn].filter(Boolean).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-xl border border-gold/10 hover:border-gold/30 
                 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/admin/matrimony/profiles/${profile.id}`)}
    >
      <div className="aspect-[4/3] bg-ivory flex items-center justify-center overflow-hidden">
        {profile.photo?.url && !imgError ? (
          <img
            src={profile.photo.url}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserIcon size={48} className="text-gold/30" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-sage uppercase tracking-wider">
            {profile.regNo}
          </span>
          <StatusBadge status={profile.currentStatus.toLowerCase() as any} minimal />
        </div>

        <p className="text-sm font-bold text-rosewood truncate">
          {name || '—'}
        </p>

        {shortlistedAt && (
          <p className="text-[10px] text-gold font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
            {t('adminMatrimony:accountDetail.shortlistedOn') || 'Shortlisted on'}{' '}
            {format(new Date(shortlistedAt), 'MMM dd, yyyy')}
          </p>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/matrimony/profiles/${profile.id}`);
          }}
          className="w-full mt-2 py-2 rounded-lg border border-gold/20 text-rosewood 
                     text-xs font-bold flex items-center justify-center gap-1.5
                     hover:bg-ivory hover:border-gold/40 transition-all"
        >
          <Eye size={14} />
          {t('adminMatrimony:accountDetail.viewProfile') || 'View Profile'}
        </button>
      </div>
    </motion.div>
  );
};

export default AccountProfileCard;