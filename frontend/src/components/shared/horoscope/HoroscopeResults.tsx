import React from 'react';
import { useTranslation } from 'react-i18next';
import type { HoroscopeResult } from '@/types/horoscope';
import HoroscopeOverview from './HoroscopeOverview';
import PlanetTable from './PlanetTable';
import D1Chart from './D1Chart';
import D9Chart from './D9Chart';

interface HoroscopeResultsProps {
  result: HoroscopeResult | null;
  loading: boolean;
  error: string | null;
  language?: 'en' | 'ta';
}

export default function HoroscopeResults({ result, loading, error, language }: HoroscopeResultsProps) {
  const { t, i18n } = useTranslation(['profile_new']);
  const lang = language || i18n.language?.slice(0, 2) as 'en' | 'ta' || 'en';

  if (loading) {
    return (
      <div className="horoscope-loading">
        <div className="horoscope-loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="horoscope-error">{error}</div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-8">
      <section className="horoscope-section">
        <HoroscopeOverview result={result} language={lang} />
      </section>

      <section className="horoscope-section">
        <div className="horoscope-section-header">
          <h3 className="horoscope-section-title">{lang === 'ta' ? 'கிரக நிலைகள்' : 'Planet Positions'}</h3>
        </div>
        <PlanetTable planets={result.planets} language={lang} />
      </section>

      <section className="horoscope-section">
        <div className="horoscope-charts-grid">
          <D1Chart lagnaSign={result.summary.lagnaSignIndex} planets={result.planets} title={t('horoscope.rasi_chart')} language={lang} />
          <D9Chart planets={result.planets} lagnaNavamsaSignIndex={result.lagnaNavamsa.signIndex} title={t('horoscope.navamsa_chart')} language={lang} />
        </div>
      </section>
    </div>
  );
}
