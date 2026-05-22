import React from 'react';
import type { HoroscopeResult } from '@/types/horoscope';
import { SIGNS, SIGNS_TAMIL, NAKSHATRAS, NAKSHATRAS_TAMIL } from '@/types/horoscope';

interface HoroscopeOverviewProps {
  result: HoroscopeResult;
  language?: 'en' | 'ta';
}

export default function HoroscopeOverview({ result, language = 'en' }: HoroscopeOverviewProps) {
  const { summary } = result;
  const isTa = language === 'ta';

  const rasiSign = SIGNS[summary.rasiSignIndex];
  const rasiLabel = isTa ? SIGNS_TAMIL[rasiSign] : rasiSign;
  const lagnaSign = SIGNS[summary.lagnaSignIndex];
  const lagnaLabel = isTa ? SIGNS_TAMIL[lagnaSign] : lagnaSign;
  const nakshatra = NAKSHATRAS[summary.nakshatraIndex];
  const nakshatraLabel = isTa ? NAKSHATRAS_TAMIL[nakshatra] : nakshatra;

  return (
    <div className="horoscope-overview-section">
      <div className="horoscope-overview-header">
        <h2 className="horoscope-overview-title">
          {isTa ? 'ஜாதக சுருக்கம்' : 'Birth Chart Summary'}
        </h2>
        <p className="horoscope-overview-subtitle">{summary.locationName}</p>
      </div>

      <div className="horoscope-overview-cards">
        <div className="horoscope-overview-card">
          <div className="horoscope-overview-card-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </div>
          <p className="horoscope-overview-card-label">{isTa ? 'ராசி' : 'Rasi'}</p>
          <p className="horoscope-overview-card-value">{rasiLabel}</p>
          <div className="horoscope-overview-card-divider" />
          <p className="horoscope-overview-card-sub">{isTa ? 'சந்திர ராசி' : 'Moon Sign'}</p>
        </div>

        <div className="horoscope-overview-card">
          <div className="horoscope-overview-card-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <p className="horoscope-overview-card-label">{isTa ? 'லக்கினம்' : 'Lagnam'}</p>
          <p className="horoscope-overview-card-value">{lagnaLabel}</p>
          <div className="horoscope-overview-card-divider" />
          <p className="horoscope-overview-card-sub">{isTa ? 'உயிர் லக்னம்' : 'Ascendant'}</p>
        </div>

        <div className="horoscope-overview-card">
          <div className="horoscope-overview-card-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>
          <p className="horoscope-overview-card-label">{isTa ? 'நட்சத்திரம்' : 'Nakshatra'}</p>
          <p className="horoscope-overview-card-value">{nakshatraLabel}</p>
          <div className="horoscope-overview-card-divider" />
          <p className="horoscope-overview-card-sub">{isTa ? `பாதம் ${summary.nakshatraPada}` : `Pada ${summary.nakshatraPada}`}</p>
        </div>
      </div>
    </div>
  );
}
