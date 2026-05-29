import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
import { AdminMembershipCard } from './AdminMembershipCard';
import { EditPlanModal } from './EditPlanModal';
import { adminListPlans, adminGetSetting, adminUpdateSetting } from '@/api/admin-membership.api';
import type { MembershipPlan } from '@/api/membership.api';

const MembershipManagement: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const { t } = useTranslation();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membershipEnabled, setMembershipEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ plans: planData }, { membershipEnabled: enabled }] = await Promise.all([
        adminListPlans(),
        adminGetSetting(),
      ]);
      setPlans(planData);
      setMembershipEnabled(enabled);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const { membershipEnabled: newVal } = await adminUpdateSetting(!membershipEnabled);
      setMembershipEnabled(newVal);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RotateCcw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8 max-w-7xl mx-auto pb-16 pt-8">
      <div className="flex items-center justify-between px-4">
        <h1 className="text-xl font-bold text-rosewood">
          {isTamil ? 'உறுப்பினர் திட்டங்கள்' : 'Membership Plans'}
        </h1>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            membershipEnabled
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {membershipEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {membershipEnabled
            ? (isTamil ? 'செயலில்' : 'Enabled')
            : (isTamil ? 'முடக்கப்பட்டது' : 'Disabled')}
        </button>
      </div>

      {!membershipEnabled && (
        <div className="mx-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700 font-medium">
            {isTamil
              ? 'உறுப்பினர் முறை முடக்கப்பட்டுள்ளது. அனைத்து பயனர்களுக்கும் அனைத்து அம்சங்களும் இலவசமாக கிடைக்கும்.'
              : 'Membership system is disabled. All features are free for all users.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {plans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <AdminMembershipCard plan={plan} isTamil={isTamil} onEdit={setEditingPlan} />
          </motion.div>
        ))}
      </div>

      {editingPlan && (
        <EditPlanModal plan={editingPlan} isTamil={isTamil} onClose={() => setEditingPlan(null)} onSaved={fetchData} />
      )}
    </motion.div>
  );
};

export default MembershipManagement;
