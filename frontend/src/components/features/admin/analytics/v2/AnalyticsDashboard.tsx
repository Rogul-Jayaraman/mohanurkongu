import React from 'react';
import { motion } from 'framer-motion';
import { useAnalyticsData, SectionKey } from './hooks/useAnalyticsData';
import { ManamaalaiSection } from './sections/ManamaalaiSection';
import { MandapamSection } from './sections/MandapamSection';
import { MembershipSection } from './sections/MembershipSection';
import { OperationsSection } from './sections/OperationsSection';
import { Spinner } from '@/components/ui/feedback/Spinner';
import { clsx } from 'clsx';

const TABS: { key: SectionKey; label: string }[] = [
  { key: 'manamaalai', label: 'Manamaalai' },
  { key: 'mandapam', label: 'Mandapam' },
  { key: 'membership', label: 'Membership' },
  { key: 'operations', label: 'Operations' },
];

const SECTION_COMPONENTS: Record<SectionKey, React.FC<{ data: any; loading: boolean }>> = {
  manamaalai: ManamaalaiSection,
  mandapam: MandapamSection,
  membership: MembershipSection,
  operations: OperationsSection,
};

export const AnalyticsDashboard: React.FC = () => {
  const { sections, error, refetch, refetchSection, activeSection, setActiveSection } = useAnalyticsData();

  const ActiveComponent = SECTION_COMPONENTS[activeSection];
  const activeState = sections[activeSection];
  const activeData = activeState.data;
  const activeLoading = activeState.loading;
  const activeError = activeState.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1400px] mx-auto space-y-8 pb-12"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-rosewood">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Data-driven insights across the platform</p>
        </div>
        {activeError && (
          <button
            onClick={() => refetchSection(activeSection)}
            className="px-6 py-2.5 bg-rosewood text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all"
          >
            Retry
          </button>
        )}
      </div>

      {/* ── Global Error ── */}
      {error && !activeError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-red-600 text-sm">{error}</span>
          <button onClick={refetch} className="ml-auto text-xs font-bold text-red-700 underline">Retry all</button>
        </div>
      )}

      {/* ── Section Error ── */}
      {activeError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-red-600 text-sm">{activeError}</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-ivory-tint/80 p-1 rounded-xl w-fit border border-gold/10">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={clsx(
              'px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all',
              activeSection === tab.key
                ? 'bg-white text-rosewood shadow-sm border border-gold/20'
                : 'text-slate-500 hover:text-rosewood'
            )}
          >
            {tab.label}
            {sections[tab.key].loading && (
              <span className="ml-2 inline-block w-2 h-2 bg-gold/60 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <motion.div key={activeSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {activeLoading && !activeData ? (
          <div className="flex items-center justify-center py-32">
            <Spinner />
          </div>
        ) : (
          <ActiveComponent data={activeData} loading={activeLoading} />
        )}
      </motion.div>
    </motion.div>
  );
};
