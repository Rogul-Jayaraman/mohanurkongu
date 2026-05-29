import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MembershipPlan } from '@/api/membership.api';
import { adminUpdatePlan } from '@/api/admin-membership.api';

interface EditPlanModalProps {
  plan: MembershipPlan | null;
  isTamil: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const searchLevels = ['BASIC', 'STANDARD', 'ADVANCED'];

export const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, isTamil, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
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
        contactAccess: plan.contactAccess,
        fullHoroscopeAccess: plan.fullHoroscopeAccess,
        printProfile: plan.printProfile,
        printHoroscope: plan.printHoroscope,
        searchLevel: plan.searchLevel,
        status: plan.status,
      });
    }
  }, [plan]);

  if (!plan) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdatePlan(plan.id, form);
      onSaved();
      onClose();
    } catch {
      // error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const label = (en: string, ta: string) => isTamil ? ta : en;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100">
            <X size={20} className="text-slate-500" />
          </button>

          <h2 className="text-lg font-bold text-rosewood mb-6">
            {label('Edit Plan', 'திட்டத்தைத் திருத்து')}
          </h2>

          <div className="space-y-4">
            <Field label={label('Plan Name', 'திட்ட பெயர்')}>
              <input type="text" value={form.displayName || ''} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={label('Price (₹)', 'விலை (₹)')}>
                <input type="number" value={form.displayPrice || 0} onChange={(e) => setForm({ ...form, displayPrice: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </Field>
              <Field label={label('Duration (days)', 'கால அளவு (நாட்கள்)')}>
                <input type="number" value={form.durationDays || 0} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label={label('Open Limit', 'திறப்பு வரம்பு')}>
                <input type="number" value={form.openLimit || 0} onChange={(e) => setForm({ ...form, openLimit: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </Field>
              <Field label={label('Shortlist', 'குறும்பட்டியல்')}>
                <input type="number" value={form.shortlistLimit || 0} onChange={(e) => setForm({ ...form, shortlistLimit: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </Field>
              <Field label={label('Slots', 'இடங்கள்')}>
                <input type="number" value={form.profileSlotLimit || 0} onChange={(e) => setForm({ ...form, profileSlotLimit: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              </Field>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">{label('Capabilities', 'திறன்கள்')}</label>
              <div className="grid grid-cols-2 gap-2">
                <Toggle label={label('Contact Access', 'தொடர்பு அணுகல்')} checked={!!form.contactAccess} onChange={(v) => setForm({ ...form, contactAccess: v })} />
                <Toggle label={label('Full Horoscope', 'முழு ஜாதகம்')} checked={!!form.fullHoroscopeAccess} onChange={(v) => setForm({ ...form, fullHoroscopeAccess: v })} />
                <Toggle label={label('Print Profile', 'சுயவிவர அச்சு')} checked={!!form.printProfile} onChange={(v) => setForm({ ...form, printProfile: v })} />
                <Toggle label={label('Print Horoscope', 'ஜாதக அச்சு')} checked={!!form.printHoroscope} onChange={(v) => setForm({ ...form, printHoroscope: v })} />
              </div>
            </div>

            <Field label={label('Search Level', 'தேடல் நிலை')}>
              <select value={form.searchLevel || 'BASIC'} onChange={(e) => setForm({ ...form, searchLevel: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
                {searchLevels.map((sl) => (
                  <option key={sl} value={sl}>{sl}</option>
                ))}
              </select>
            </Field>

            <Field label={label('Status', 'நிலை')}>
              <select value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
                <option value="ACTIVE">{label('Active', 'செயலில்')}</option>
                <option value="INACTIVE">{label('Inactive', 'செயலற்றது')}</option>
              </select>
            </Field>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              {label('Cancel', 'ரத்துசெய்')}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-rosewood text-sm font-semibold text-white hover:bg-rosewood/90 transition-colors disabled:opacity-50">
              {saving ? (isTamil ? 'சேமிக்கிறது...' : 'Saving...') : label('Save', 'சேமி')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-slate-600">{label}</label>
    {children}
  </div>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="rounded border-slate-300 text-rosewood focus:ring-rosewood/30" />
    <span className="text-xs text-slate-600">{label}</span>
  </label>
);
