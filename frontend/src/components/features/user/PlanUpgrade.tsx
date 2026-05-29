import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useMembership } from '@/hooks/useMembership';
import { Check, Crown, IndianRupee, Loader2 } from 'lucide-react';
import { AdminMembershipCard } from '@/components/features/admin/matrimony/AdminMembershipCard';

const PlanUpgrade: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const { t } = useTranslation();
  const { plans, subscription, capabilities, loading } = useMembership();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <Crown size={40} className="mx-auto text-gold" />
        <h1 className="text-2xl font-bold text-rosewood">
          {isTamil ? 'உறுப்பினர் திட்டங்கள்' : 'Membership Plans'}
        </h1>
        <p className="text-sm text-slate-500">
          {isTamil ? 'உங்கள் தேவைகளுக்கு ஏற்ற திட்டத்தைத் தேர்வுசெய்க' : 'Choose a plan that suits your needs'}
        </p>
      </div>

      {subscription && (
        <div className="px-4 py-3 rounded-xl bg-rosewood/5 border border-rosewood/20 text-center">
          <p className="text-sm text-rosewood font-medium">
            {isTamil
              ? `தற்போதைய திட்டம்: ${subscription.snapshotPlanName}`
              : `Current Plan: ${subscription.snapshotPlanName}`}
            {subscription.expiresAt && (
              <span className="block text-xs text-slate-500 mt-1">
                {isTamil
                  ? `காலாவதி: ${new Date(subscription.expiresAt).toLocaleDateString()}`
                  : `Expires: ${new Date(subscription.expiresAt).toLocaleDateString()}`}
              </span>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <AdminMembershipCard plan={plan} isTamil={isTamil} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PlanUpgrade;
