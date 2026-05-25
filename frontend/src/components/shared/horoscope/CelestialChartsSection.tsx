import React from 'react';
import type { HoroscopeResult } from '@/types/horoscope';
import { RASI_OPTIONS, NAKSHATRA_OPTIONS } from '@/constants';
import { getBilingualLabel } from '@/utils/bilingual';

interface CelestialChartsSectionProps {
  result: HoroscopeResult | null;
  language?: 'en' | 'ta';
}

export default function CelestialChartsSection({ result, language = 'en' }: CelestialChartsSectionProps) {
  const { summary } = result || {} as HoroscopeResult;
  const lang: 'en' | 'ta' = language;

  const rasiOption = RASI_OPTIONS[summary.rasiSignIndex];
  const rasiLabel = rasiOption ? getBilingualLabel(rasiOption.label, lang) : '';

  const lagnaOption = RASI_OPTIONS[summary.lagnaSignIndex];
  const lagnaLabel = lagnaOption ? getBilingualLabel(lagnaOption.label, lang) : '';

  const nakshatraOption = NAKSHATRA_OPTIONS[summary.nakshatraIndex];
  const nakshatraLabel = nakshatraOption ? getBilingualLabel(nakshatraOption.label, lang) : '';

  return (
    <div className="space-y-6">
      <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm transition-all hover:shadow-md">
        <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3">
          <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center text-rosewood">
            <span className="material-symbols-outlined text-base!">auto_awesome</span>
          </div>
          <h3 className="text-sm font-serif font-bold text-rosewood">
            {lang === 'ta' ? 'ஜாதக விவரங்கள்' : 'Celestial Chart Details'}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest">{lang === 'ta' ? 'நட்சத்திரம்' : 'Star (Nakshatra)'}</p>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{nakshatraLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest">{lang === 'ta' ? 'சந்திர ராசி' : 'Moon Sign (Rasi)'}</p>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{rasiLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest">{lang === 'ta' ? 'உயிர் லக்னம்' : 'Ascendant (Lagnam)'}</p>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{lagnaLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
