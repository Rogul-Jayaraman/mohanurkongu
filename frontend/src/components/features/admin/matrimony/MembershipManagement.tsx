import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
import { AdminMembershipCard } from './AdminMembershipCard';
import { EditPlanModal } from './EditPlanModal';
import { adminListPlans, adminGetSetting, adminUpdateSetting } from '@/api/admin-membership.api';
import type { MembershipPlan } from '@/api/membership.api';
import { queryKeys } from '@/queries/queryKeys';
import { showErrorToast } from '@/queries/mutationUtils';

const MembershipManagement: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  const plansQuery = useQuery({
    queryKey: [...queryKeys.membership.all, 'admin', 'plans'] as const,
    queryFn: async () => (await adminListPlans()).plans as MembershipPlan[],
  });

  const settingQuery = useQuery({
    queryKey: [...queryKeys.membership.all, 'admin', 'setting'] as const,
    queryFn: async () => (await adminGetSetting()).membershipEnabled,
  });

  const toggleMutation = useMutation({
    mutationFn: (next: boolean) => adminUpdateSetting(next).then((r) => r.membershipEnabled),
    onSuccess: (newVal) => {
      qc.setQueryData([...queryKeys.membership.all, 'admin', 'setting'], newVal);
      qc.invalidateQueries({ queryKey: queryKeys.membership.all });
    },
    onError: (err) => showErrorToast(err, 'Could not update setting'),
  });

  const plans: MembershipPlan[] = plansQuery.data ?? [];
  const membershipEnabled = settingQuery.data ?? true;
  const loading = plansQuery.isPending || settingQuery.isPending;
  const toggling = toggleMutation.isPending;

  const refreshAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: [...queryKeys.membership.all, 'admin'] });
  }, [qc]);

  const handleToggle = () => {
    toggleMutation.mutate(!membershipEnabled);
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
          {t('adminMatrimony:plans.title')}
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
            ? t('adminMatrimony:plans.active')
            : t('adminMatrimony:common.inactive')}
        </button>
      </div>

      {!membershipEnabled && (
        <div className="mx-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700 font-medium">
            {t('adminMatrimony:plans.disabledWarning')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {plans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <AdminMembershipCard plan={plan} onEdit={setEditingPlan} onRefresh={refreshAll} />
          </motion.div>
        ))}
      </div>

      {editingPlan && (
        <EditPlanModal plan={editingPlan} onClose={() => setEditingPlan(null)} onSaved={refreshAll} />
      )}
    </motion.div>
  );
};

export default MembershipManagement;
