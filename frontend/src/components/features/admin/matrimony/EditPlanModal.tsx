import React, { useState, useEffect } from 'react';
import { X, Settings, Loader2 } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { MembershipPlan } from '@/api/membership.api';
import { useAdminUpdatePlanMutation } from '@/queries/useAdminMembershipMutations';

interface EditPlanModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

const searchLevels = ['BASIC', 'EXTENDED', 'ADVANCED', 'FULL'];
const viewDetailsLevels = ['BASIC', 'EXTENDED', 'ADVANCED', 'FULL'];

export const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, onClose, onSaved }) => {
  const { t } = useTranslation();
  const isOpen = !!plan;
  const updatePlanMut = useAdminUpdatePlanMutation();
  const saving = updatePlanMut.isPending;
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (plan) {
      setForm({
        displayName: plan.displayName,
        displayPrice: plan.displayPrice,
        durationDays: plan.durationDays,
        openLimit: plan.openLimit,
        shortlistLimit: plan.shortlistLimit,
        profileSlotLimit: plan.profileSlotLimit,
        viewDetails: plan.viewDetails,
        printProfile: plan.printProfile,
        printHoroscope: plan.printHoroscope,
        searchLevel: plan.searchLevel,
      });
    }
  }, [plan]);

  const handleSave = async () => {
    if (!plan) return;
    try {
      await updatePlanMut.mutateAsync({ planId: plan.id, data: form });
      toast.success(t('adminMatrimony:plans.saveSuccess'));
      onSaved();
      onClose();
    } catch {
      toast.error(t('adminMatrimony:plans.saveError'));
    }
  };

  const set = (key: string, value: any) => setForm({ ...form, [key]: value });

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={<Settings size={24} className="text-rosewood" />}
      title={t('adminMatrimony:plans.editPlan')}
      size="xl"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gold/10 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm"
          >
            {t('adminMatrimony:common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-rosewood text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {saving ? t('adminMatrimony:plans.form.saving') : t('adminMatrimony:common.save')}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="p-4 bg-ivory/50 rounded-xl border border-gold/20 shadow-sm">
          <span className="text-[9px] text-rosewood/40 font-black uppercase tracking-widest block mb-1">
            {t('adminMatrimony:plans.form.planName')}
          </span>
          <input
            type="text"
            value={form.displayName || ''}
            onChange={(e) => set('displayName', e.target.value)}
            className="w-full h-10 bg-white/80 rounded-lg px-3 border border-gold/20 text-sm font-bold text-rosewood placeholder:text-rosewood/30 outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/10 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
              {t('adminMatrimony:plans.form.price')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.displayPrice ? form.displayPrice.toLocaleString('en-IN') : ''}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); set('displayPrice', v === '' ? 0 : parseInt(v)); }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full h-12 px-4 rounded-xl border border-gold/20 text-sm font-bold text-rosewood bg-ivory/80 outline-none focus:border-gold/40 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
              {t('adminMatrimony:plans.form.durationDays')}
            </label>
            <input
              type="number"
              value={form.durationDays || 0}
              onChange={(e) => set('durationDays', Number(e.target.value))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full h-12 px-4 rounded-xl border border-gold/20 text-sm font-bold text-rosewood bg-ivory/80 outline-none focus:border-gold/40 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
              {t('adminMatrimony:plans.form.openLimit')}
            </label>
            <input
              type="number"
              value={form.openLimit || 0}
              onChange={(e) => set('openLimit', Number(e.target.value))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full h-12 px-4 rounded-xl border border-gold/20 text-sm font-bold text-rosewood bg-ivory/80 outline-none focus:border-gold/40 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
              {t('adminMatrimony:plans.form.shortlist')}
            </label>
            <input
              type="number"
              value={form.shortlistLimit || 0}
              onChange={(e) => set('shortlistLimit', Number(e.target.value))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full h-12 px-4 rounded-xl border border-gold/20 text-sm font-bold text-rosewood bg-ivory/80 outline-none focus:border-gold/40 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
              {t('adminMatrimony:plans.form.slots')}
            </label>
            <input
              type="number"
              value={form.profileSlotLimit || 0}
              onChange={(e) => set('profileSlotLimit', Number(e.target.value))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full h-12 px-4 rounded-xl border border-gold/20 text-sm font-bold text-rosewood bg-ivory/80 outline-none focus:border-gold/40 transition-all"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
            {t('adminMatrimony:plans.form.viewDetails')}
          </label>
          <div className="flex gap-2.5">
            {viewDetailsLevels.map((vd) => (
              <button
                key={vd}
                type="button"
                onClick={() => set('viewDetails', vd)}
                className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${
                  form.viewDetails === vd
                    ? 'bg-rosewood text-ivory border-rosewood shadow-sm'
                    : 'bg-ivory/80 text-rosewood/40 border-gold/10 hover:border-gold/30'
                }`}
              >
                {vd}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CapabilityToggle
            label={t('adminMatrimony:plans.form.printProfile')}
            checked={!!form.printProfile}
            onChange={(v) => set('printProfile', v)}
          />
          <CapabilityToggle
            label={t('adminMatrimony:plans.form.printHoroscope')}
            checked={!!form.printHoroscope}
            onChange={(v) => set('printHoroscope', v)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
            {t('adminMatrimony:plans.form.searchLevel')}
          </label>
          <div className="flex gap-2.5">
            {searchLevels.map((sl) => (
              <button
                key={sl}
                type="button"
                onClick={() => set('searchLevel', sl)}
                className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${
                  form.searchLevel === sl
                    ? 'bg-rosewood text-ivory border-rosewood shadow-sm'
                    : 'bg-ivory/80 text-rosewood/40 border-gold/10 hover:border-gold/30'
                }`}
              >
                {sl}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

const CapabilityToggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
      checked
        ? 'bg-rosewood/10 border-rosewood/30 shadow-sm'
        : 'bg-ivory/80 border-gold/10 hover:border-gold/30'
    }`}
  >
    <div
      className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
        checked ? 'bg-rosewood shadow-sm' : 'bg-white border border-slate-300'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="4">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </div>
    <span className={`text-xs font-bold transition-colors ${checked ? 'text-rosewood' : 'text-slate-500'}`}>
      {label}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
  </label>
);
