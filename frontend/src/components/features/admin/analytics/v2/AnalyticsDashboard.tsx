import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyticsData, SectionKey } from './hooks/useAnalyticsData';
import { ManamaalaiSection } from './sections/ManamaalaiSection';
import { MandapamSection } from './sections/MandapamSection';
import { Spinner } from '@/components/ui/feedback/Spinner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import CentralToggleButton from '@/components/ui/forms/CentralToggleButton';

const SECTION_COMPONENTS: Record<SectionKey, React.FC<{ data: any; loading: boolean }>> = {
  manamaalai: ManamaalaiSection,
  mandapam: MandapamSection,
};

const GlassHeader: React.FC<{
  activeSection: SectionKey;
  onChange: (key: string) => void;
}> = ({ activeSection, onChange }) => (
  <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl overflow-hidden">
    <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
    <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
    <div className="relative z-10">
      <div className="px-6 py-6 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl">
        <div className="flex items-center justify-center">
          <CentralToggleButton
            value={activeSection}
            onChange={onChange}
            options={[
              { value: 'manamaalai', label: { en: 'Manamaalai', ta: 'மணமாலை' } },
              { value: 'mandapam', label: { en: 'Mandapam', ta: 'மண்டபம்' } },
            ]}
            variant="rosewood"
            name="analytics-tab"
            glass
          />
        </div>
      </div>
    </div>
  </div>
);

export const AnalyticsDashboard: React.FC = () => {
  const { sections, refetchSection, activeSection, setActiveSection } = useAnalyticsData();

  const ActiveComponent = SECTION_COMPONENTS[activeSection];
  const activeState = sections[activeSection];
  const activeData = activeState.data;
  const activeLoading = activeState.loading;
  const activeError = activeState.error;

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto pb-12">
      <GlassHeader activeSection={activeSection} onChange={(val) => setActiveSection(val as SectionKey)} />

      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
          >
            <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 px-6 py-5">
                <div className="size-10 shrink-0 rounded-xl bg-rosewood-gradient flex items-center justify-center shadow-md">
                  <AlertCircle size={20} className="text-gold" />
                </div>
                <span className="text-sm text-red-700 flex-1">{activeError}</span>
                <button
                  onClick={() => refetchSection(activeSection)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-rosewood-gradient text-gold text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all shadow-md"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeLoading && !activeData ? (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-32"
          >
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" color="gold" />
              <p className="text-xs font-black text-gold uppercase tracking-widest animate-pulse">Loading {activeSection} data</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <ErrorBoundary key={activeSection}>
              <ActiveComponent data={activeData} loading={activeLoading} />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Alert */}
      <div className="relative bg-white/10 backdrop-blur-2xl border border-gold/30 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 px-6 py-6 flex items-center gap-4">
          <div className="size-12 shrink-0 rounded-xl bg-rosewood-gradient flex items-center justify-center shadow-md">
            <ShieldCheck size={24} className="text-gold" />
          </div>
          <div>
            <p className="text-[9px] font-black text-rosewood/50 uppercase tracking-[0.2em] mb-0.5">STATUS WATCH</p>
            <h4 className="text-sm font-serif font-black text-rosewood leading-tight">
              {activeError ? 'System requires attention' : activeLoading ? 'Decrypting intelligence streams...' : `All systems operational — ${activeSection} analytics online`}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};