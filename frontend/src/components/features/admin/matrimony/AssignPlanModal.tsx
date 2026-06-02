import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, IndianRupee, Check, X } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { useLanguage } from '@/context/LanguageContext';
import { useAdminAssignSubscriptionMutation } from '@/queries/useAdminAccountQueries';
import type { MembershipPlan } from '@/api/membership.api';
import type { PaymentMethodType } from '@/api/admin-accounts.api';
import { toast } from 'sonner';

interface AssignPlanModalProps {
  accountId: string;
  currentPlanCode?: string | null;
  availablePlans: MembershipPlan[];
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

const PAYMENT_METHODS: { key: PaymentMethodType; labelEn: string; labelTa: string }[] = [
  { key: 'CASH', labelEn: 'Cash', labelTa: 'ரொக்கம்' },
  { key: 'UPI', labelEn: 'UPI', labelTa: 'UPI' },
  { key: 'BANK_TRANSFER', labelEn: 'Bank Transfer', labelTa: 'வங்கி பரிமாற்றம்' },
  { key: 'CHEQUE', labelEn: 'Cheque', labelTa: 'காசோலை' },
  { key: 'OTHER', labelEn: 'Other', labelTa: 'மற்றவை' },
];

const planColors: Record<string, string> = {
  BRONZE: 'from-amber-700/10 to-amber-900/5 border-amber-700/20',
  SILVER: 'from-slate-300/20 to-slate-400/10 border-slate-400/20',
  GOLD: 'from-yellow-400/15 to-yellow-600/8 border-yellow-500/20',
  PLATINUM: 'from-cyan-200/20 to-cyan-400/10 border-cyan-300/20',
};

const planAccent: Record<string, string> = {
  BRONZE: 'bg-amber-700 text-white',
  SILVER: 'bg-slate-500 text-white',
  GOLD: 'bg-yellow-500 text-rosewood',
  PLATINUM: 'bg-cyan-500 text-white',
};

const AssignPlanModal: React.FC<AssignPlanModalProps> = ({
  accountId,
  currentPlanCode,
  availablePlans,
  isOpen,
  onClose,
  onAssigned,
}) => {
  const { t, language } = useLanguage();
  const isTamil = language === 'ta';

  const assignMut = useAdminAssignSubscriptionMutation();
  const saving = assignMut.isPending;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [notes, setNotes] = useState('');

  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);
  const isFreePlan = selectedPlan?.displayPrice === 0;
  const isValid = selectedPlanId && (isFreePlan || paymentMethod);

  const handleAssign = async () => {
    if (!selectedPlanId || !isValid) return;
    try {
      await assignMut.mutateAsync({
        accountId,
        planId: selectedPlanId,
        options: {
          paymentMethod: isFreePlan ? undefined : (paymentMethod ?? undefined),
          notes: notes.trim() || undefined,
        },
      });
      onAssigned();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to assign plan');
    }
  };

  const handleClose = () => {
    setSelectedPlanId(null);
    setPaymentMethod(null);
    setNotes('');
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      icon={
        <div className="p-2 bg-gold-soft/20 rounded-xl">
          <Crown className="text-gold" size={20} />
        </div>
      }
      title={isTamil ? 'உறுப்பினர் திட்டத்தை மாற்றவும்' : 'Change Membership Plan'}
      size="2xl"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-6 py-3 border border-gold/10 text-rosewood font-bold 
                       rounded-xl hover:bg-ivory transition-all text-sm disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleAssign}
            disabled={!isValid || saving}
            className="flex-1 px-6 py-3 bg-rosewood text-white font-bold rounded-xl 
                       hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 
                       disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>{t('adminMatrimony:accountDetail.assignPlan') || 'Assign Plan'}</>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-rosewood/60 font-medium">
          {isTamil
            ? 'இந்தக் கணக்கிற்கு ஒதுக்க வேண்டிய திட்டத்தைத் தேர்ந்தெடுக்கவும்'
            : 'Select a plan to assign to this account'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availablePlans.map((plan) => {
            const isCurrent = plan.code === currentPlanCode;
            const isSelected = plan.id === selectedPlanId;
            return (
              <motion.button
                key={plan.id}
                type="button"
                disabled={isCurrent}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setPaymentMethod(null);
                }}
                whileHover={!isCurrent ? { y: -2 } : undefined}
                whileTap={!isCurrent ? { scale: 0.98 } : undefined}
                className={`relative flex flex-col p-5 rounded-xl border-2 text-left transition-all ${
                  isCurrent
                    ? 'border-gold/40 bg-gold-soft/10 opacity-70 cursor-not-allowed'
                    : isSelected
                      ? 'border-rosewood bg-rosewood/5 shadow-lg ring-1 ring-rosewood/10'
                      : 'border-gold/10 bg-white hover:border-gold/30 hover:shadow-md'
                } ${planColors[plan.code] || ''}`}
              >
                {isCurrent && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold text-rosewood text-[8px] font-black uppercase">
                    {t('myaccount:membership.card.current') || 'Current'}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${planAccent[plan.code] || 'bg-rosewood text-white'}`}>
                    {plan.code === 'PLATINUM' ? <Crown size={16} /> : <Check size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rosewood">{plan.displayName}</p>
                    <div className="flex items-center gap-1 text-xs text-gold font-bold">
                      <IndianRupee size={10} />
                      {plan.displayPrice === 0
                        ? (isTamil ? 'இலவசம்' : 'Free')
                        : `₹${plan.displayPrice.toLocaleString()}`}
                      {plan.durationDays > 0 && (
                        <span className="text-sage font-medium">
                          / {plan.durationDays} {isTamil ? 'நாட்கள்' : 'days'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 font-medium">
                  <p>
                    {isTamil ? 'தேடல் நிலை' : 'Search'}: {plan.searchLevel}
                  </p>
                  <p>
                    {isTamil ? 'விவரங்கள்' : 'Details'}: {plan.viewDetails}
                  </p>
                  <p>
                    {isTamil ? 'சுயவிவரங்கள்' : 'Profiles'}: {plan.profileSlotLimit}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {selectedPlan && !isFreePlan && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-rosewood/50 uppercase tracking-widest">
              {isTamil ? 'கட்டண முறை' : 'Payment Method'}
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.key}
                  type="button"
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === pm.key
                      ? 'bg-rosewood text-white border-rosewood shadow-md'
                      : 'bg-white text-rosewood border-gold/20 hover:border-gold/40 hover:bg-ivory'
                  }`}
                >
                  {isTamil ? pm.labelTa : pm.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedPlan && isFreePlan && (
          <div className="p-4 rounded-xl bg-ivory border border-gold/10">
            <p className="text-xs font-bold text-sage">
              {isTamil
                ? 'இலவசத் திட்டம் — கட்டணம் தேவையில்லை'
                : 'Free plan — no payment required'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-rosewood/50 uppercase tracking-widest">
            {isTamil ? 'குறிப்புகள் (விரும்பினால்)' : 'Notes (optional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={isTamil ? 'நிர்வாக குறிப்புகள்...' : 'Admin notes...'}
            className="w-full bg-ivory/80 border-2 border-gold/20 focus:border-gold/40 
                       hover:border-gold/30 rounded-xl p-4 text-sm text-slate-800 
                       outline-none transition-all resize-none"
          />
        </div>
      </div>
    </ModalShell>
  );
};

export default AssignPlanModal;