import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Edit2, IndianRupee } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MembershipPlan } from '@/api/membership.api';
import { formatCurrency } from '@/utils/format';
import { useAdminUpdatePlanMutation } from '@/queries/useAdminMembershipMutations';

interface AdminMembershipCardProps {
  plan: MembershipPlan;
  onEdit?: (plan: MembershipPlan) => void;
  onRefresh?: () => void;
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

export const AdminMembershipCard: React.FC<AdminMembershipCardProps> = ({ plan, onEdit, onRefresh }) => {
  const { t } = useTranslation();
  const updatePlanMut = useAdminUpdatePlanMutation();
  const toggling = updatePlanMut.isPending;

  const {
    code, displayName, displayPrice, durationDays, status,
    openLimit, shortlistLimit, profileSlotLimit,
    viewDetails, printProfile, printHoroscope, searchLevel,
  } = plan;

  const viewDetailsLabels: Record<string, string> = {
    BASIC: t('adminMatrimony:plans.card.viewDetailsBasic'),
    EXTENDED: t('adminMatrimony:plans.card.viewDetailsExtended'),
    ADVANCED: t('adminMatrimony:plans.card.viewDetailsAdvanced'),
    FULL: t('adminMatrimony:plans.card.viewDetailsFull'),
  };

  const searchLevelLabels: Record<string, string> = {
    BASIC: t('adminMatrimony:plans.card.searchBasic'),
    EXTENDED: t('adminMatrimony:plans.card.searchExtended'),
    ADVANCED: t('adminMatrimony:plans.card.searchAdvanced'),
    FULL: t('adminMatrimony:plans.card.searchFull'),
  };

  const features: string[] = [
    t('adminMatrimony:plans.card.perDay', { count: openLimit }),
    openLimit === -1
      ? t('adminMatrimony:plans.card.opensUnlimited')
      : t('adminMatrimony:plans.card.opens', { count: openLimit }),
    shortlistLimit === -1
      ? t('adminMatrimony:plans.card.shortlistUnlimited')
      : shortlistLimit === 0
        ? t('adminMatrimony:plans.card.shortlistNone')
        : t('adminMatrimony:plans.card.shortlist', { count: shortlistLimit }),
    t('adminMatrimony:plans.card.profiles', { count: profileSlotLimit }),
    viewDetailsLabels[viewDetails] || viewDetails,
    searchLevelLabels[searchLevel] || searchLevel,
    printProfile
      ? t('adminMatrimony:plans.card.printProfileOn')
      : t('adminMatrimony:plans.card.printDisabled'),
    printHoroscope
      ? t('adminMatrimony:plans.card.printHoroscopeOn')
      : t('adminMatrimony:plans.card.printDisabled'),
  ];

  const isActive = status === 'ACTIVE';

  const handleStatusToggle = async () => {
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    try {
      await updatePlanMut.mutateAsync({ planId: plan.id, data: { status: newStatus } });
      onRefresh?.();
    } catch {
      // error handled by interceptor
    }
  };

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
        <div className="my-4">
          <h3 className="text-lg font-bold text-rosewood tracking-tight leading-tight uppercase">{displayName}</h3>
        </div>

        <div className="mb-4 flex items-baseline gap-1">
          <IndianRupee size={16} className="text-gold/80" />
          <span className="text-xl font-semibold text-gold/80">
            {displayPrice === 0 ? t('adminMatrimony:plans.card.free') : formatCurrency(displayPrice)}
          </span>
          {durationDays > 0 && (
            <span className="text-sage text-[9px] ml-1">
              {t('adminMatrimony:plans.card.daysSuffix', { count: durationDays })}
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

      <div className="relative flex items-center justify-between pt-4 mt-auto border-t border-slate-200/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStatusToggle}
            disabled={toggling}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isActive ? 'bg-emerald-400' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                isActive ? 'translate-x-[18px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
          <span className={`text-xs font-semibold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isActive ? t('adminMatrimony:plans.toggleActive') : t('adminMatrimony:plans.toggleInactive')}
          </span>
        </div>
        <button
          onClick={() => onEdit?.(plan)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rosewood text-white text-xs font-semibold hover:bg-rosewood/90 transition-colors"
        >
          <Edit2 size={14} />
          {t('adminMatrimony:plans.editPlan')}
        </button>
      </div>
    </motion.div>
  );
};
