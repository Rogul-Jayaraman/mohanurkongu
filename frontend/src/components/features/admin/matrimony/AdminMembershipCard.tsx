import React from 'react';
import { motion } from 'framer-motion';
import { Check, Edit2, IndianRupee } from 'lucide-react';
import type { MembershipPlan } from '@/api/membership.api';

interface AdminMembershipCardProps {
  plan: MembershipPlan;
  isTamil: boolean;
  onEdit?: (plan: MembershipPlan) => void;
}

const planBadge: Record<string, string> = {
  BRONZE: 'FREE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
};

const planColors: Record<string, string> = {
  BRONZE: 'from-amber-700/20 to-amber-900/10 border-amber-700/30',
  SILVER: 'from-slate-300/30 to-slate-400/20 border-slate-400/30',
  GOLD: 'from-yellow-400/20 to-yellow-600/10 border-yellow-500/30',
  PLATINUM: 'from-cyan-200/30 to-cyan-400/10 border-cyan-300/30',
};

export const AdminMembershipCard: React.FC<AdminMembershipCardProps> = ({ plan, isTamil, onEdit }) => {
  const { code, displayName, displayPrice, durationDays, openLimit, shortlistLimit, profileSlotLimit, contactAccess, fullHoroscopeAccess, printProfile, printHoroscope, searchLevel } = plan;

  const features: string[] = [
    isTamil ? `தினமும் ${openLimit} வரன்கள் வரை` : `Up to ${openLimit} profile opens/day`,
    isTamil ? `அதிகபட்சம் ${shortlistLimit} குறும்பட்டியல்` : `Up to ${shortlistLimit} shortlists`,
    isTamil ? `அதிகபட்சம் ${profileSlotLimit} சுயவிவரங்கள்` : `Up to ${profileSlotLimit} profiles`,
    contactAccess ? (isTamil ? 'தொடர்பு தகவல் அணுகல்' : 'Contact info access') : (isTamil ? 'தொடர்பு தகவல் இல்லை' : 'No contact access'),
    fullHoroscopeAccess ? (isTamil ? 'முழு ஜாதகம்' : 'Full horoscope access') : (isTamil ? 'அடிப்படை ஜாதகம்' : 'Basic horoscope'),
    printProfile ? (isTamil ? 'சுயவிவர அச்சு' : 'Profile print') : (isTamil ? 'அச்சு இல்லை' : 'No print'),
    printHoroscope ? (isTamil ? 'ஜாதக அச்சு' : 'Horoscope print') : (isTamil ? 'அச்சு இல்லை' : 'No print'),
    searchLevel === 'ADVANCED' ? (isTamil ? 'மேம்பட்ட தேடல்' : 'Advanced search') : (searchLevel === 'STANDARD' ? (isTamil ? 'நிலையான தேடல்' : 'Standard search') : (isTamil ? 'அடிப்படை தேடல்' : 'Basic search')),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`relative flex flex-col h-full rounded-xl p-8 transition-all duration-500 hover:shadow-xl border-2 shadow-sm bg-white/10 backdrop-blur-2xl ${planColors[code] || 'border-slate-200/50'}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl overflow-hidden pointer-events-none" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 pb-1 bg-linear-to-br from-gold-soft via-ivory via-ivory to-gold-soft rounded-full z-10 border border-gold/30 shadow-md">
        <span className="text-[10px] font-black text-rosewood tracking-wide whitespace-nowrap">
          {planBadge[code] || code}
        </span>
      </div>

      <div className="relative flex flex-col flex-1">
        <div className="flex justify-between items-start my-4">
          <h3 className="text-lg font-bold text-rosewood tracking-tight leading-tight uppercase">{displayName}</h3>
          {onEdit && (
            <button onClick={() => onEdit(plan)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <Edit2 size={16} className="text-slate-500" />
            </button>
          )}
        </div>

        <div className="mb-4 flex items-baseline gap-1">
          <IndianRupee size={16} className="text-gold/80" />
          <span className="text-xl font-semibold text-gold/80">
            {displayPrice === 0 ? (isTamil ? 'இலவசம்' : 'Free') : displayPrice.toLocaleString('en-IN')}
          </span>
          {durationDays > 0 && (
            <span className="text-sage text-[9px] ml-1">
              {isTamil ? `${durationDays} நாட்கள்` : `/ ${durationDays} days`}
            </span>
          )}
        </div>

        <div className="grow space-y-3 mb-4 px-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 group/item">
              <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                <Check size={10} className="text-emerald-500" strokeWidth={4} />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
