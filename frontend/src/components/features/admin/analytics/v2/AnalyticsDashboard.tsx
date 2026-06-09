import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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

const SECTION_TITLES: Record<SectionKey, { en: string; ta: string }> = {
  manamaalai: { en: 'Manamaalai Analytics', ta: 'மணமாலை பகுப்பாய்வு' },
  mandapam: { en: 'Mandapam Analytics', ta: 'மண்டபம் பகுப்பாய்வு' },
};

const SECTION_SUBTITLES: Record<SectionKey, { en: string; ta: string }> = {
  manamaalai: { en: 'Platform overview and trends', ta: 'தள கண்ணோட்டம் மற்றும் போக்குகள்' },
  mandapam: { en: 'Venue booking performance and revenue trends', ta: 'இட முன்பதிவு செயல்திறன் மற்றும் வருவாய் போக்குகள்' },
};

export const AnalyticsDashboard: React.FC = () => {
  const { t, i18n } = useTranslation('analytics');
  const lang = i18n.language as 'en' | 'ta';
  const { sections, refetchSection, activeSection, setActiveSection } = useAnalyticsData();

  const ActiveComponent = SECTION_COMPONENTS[activeSection];
  const activeState = sections[activeSection];
  const activeData = activeState.data;
  const activeLoading = activeState.loading;
  const activeError = activeState.error;
  const title = SECTION_TITLES[activeSection];
  const subtitle = SECTION_SUBTITLES[activeSection];

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header - Left title + Right toggle */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-rosewood">
            {title[lang] ?? title.en}
          </h1>
          <p className="text-sm text-dark-brown/60 mt-0.5">
            {subtitle[lang] ?? subtitle.en}
          </p>
        </div>
        <div className="shrink-0">
          <CentralToggleButton
            value={activeSection}
            onChange={(val) => setActiveSection(val as SectionKey)}
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

      {/* Error banner */}
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
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-rosewood-gradient text-gold text-xs font-bold rounded-xl hover:shadow-lg transition-all shadow-md"
                >
                  <RefreshCw size={14} />
                  {t('page.retry')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section content */}
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
              <p className="text-sm text-dark-brown/60">{t('page.loading', { section: activeSection })}</p>
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

      {/* System status */}
      <div className="relative bg-white/10 backdrop-blur-2xl border border-gold/20 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
        <div className="relative z-10 px-6 py-5 flex items-center gap-4">
          <div className="size-10 shrink-0 rounded-xl bg-rosewood-gradient flex items-center justify-center shadow-md">
            <ShieldCheck size={20} className="text-gold" />
          </div>
          <p className="text-sm font-medium text-dark-brown">
            {activeError
              ? t('page.needAttention')
              : activeLoading
                ? t('page.systemLoading')
                : t('page.systemOnline')}
          </p>
        </div>
      </div>
    </div>
  );
};
