import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlanetData } from '@/types/horoscope';

interface BirthChartProps {
  lagnaSignIndex: number;
  planets: PlanetData[];
  title?: string;
  subtitle?: string;
  rotateHouses?: boolean;
  language?: 'en' | 'ta' | 'both';
}

const CELL = 100;
const GRID = 4 * CELL;

const SIGN_POSITIONS: Record<number, [number, number]> = {
  0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3],
  4: [2, 3], 5: [3, 3], 6: [3, 2], 7: [3, 1],
  8: [3, 0], 9: [2, 0], 10: [1, 0], 11: [0, 0],
};

const EN_LABEL: Record<string, string> = {
  Asc: 'Asc',
  Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mer',
  Jupiter: 'Jup', Venus: 'Ven', Saturn: 'Sat', Rahu: 'Rag', Ketu: 'Ket',
};

const TA_LABEL: Record<string, string> = {
  Asc: 'லக்',
  Sun: 'சூ', Moon: 'சந்', Mars: 'செ', Mercury: 'பு',
  Jupiter: 'கு', Venus: 'சுக்', Saturn: 'சனி', Rahu: 'ராகு', Ketu: 'கேது',
};

export default React.memo(function BirthChart({ lagnaSignIndex, planets, language, title, subtitle }: BirthChartProps) {
  const { t, i18n } = useTranslation(['profile_new']);
  const lang = language || i18n.language?.slice(0, 2) || 'en';
  const isTa = lang === 'ta';

  const planetGroups = useMemo(() => {
    const groups: Record<number, PlanetData[]> = {};
    for (const p of planets) {
      if (!groups[p.signIndex]) groups[p.signIndex] = [];
      groups[p.signIndex].push(p);
    }
    return groups;
  }, [planets]);

  const getLabel = (name: string) => {
    const key = `horoscope.planets.${name.toLowerCase()}`;
    const fallback = isTa ? (TA_LABEL[name] || name) : (EN_LABEL[name] || name);
    return t(key, { defaultValue: fallback });
  };

  const ascLabel = t('horoscope.lagnam_short', { defaultValue: isTa ? TA_LABEL.Asc : EN_LABEL.Asc });

  return (
    <div className="flex flex-col items-center w-full max-w-[400px] mx-auto">
      <div className="w-full bg-ivory shadow-lg shadow-rosewood/10 ring-1 ring-gold/30 aspect-square relative">
        <div className="absolute inset-0 kolam-watermark opacity-30 pointer-events-none" />
        <svg viewBox={`0 0 ${GRID} ${GRID}`} className="w-full h-full relative z-10">
          {Array.from({ length: 4 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => {
              if (row >= 1 && row <= 2 && col >= 1 && col <= 2) return null;

              const entry = Object.entries(SIGN_POSITIONS).find(
                ([_, pos]) => pos[0] === row && pos[1] === col,
              );
              const signIndex = entry ? parseInt(entry[0]) : -1;
              const signPlanets = signIndex !== -1 ? planetGroups[signIndex] || [] : [];
              const isAsc = signIndex === lagnaSignIndex;
              const hasContent = isAsc || signPlanets.length > 0;
              const x = col * CELL;
              const y = row * CELL;

              return (
                <g key={`${row}-${col}`}>
                  <rect
                    x={x} y={y} width={CELL} height={CELL}
                    fill="white" fillOpacity="0.4"
                    stroke="var(--color-gold)" strokeWidth="0.5" strokeOpacity="0.4"
                  />
                  {isAsc && (
                    <polygon
                      points={`${x},${y} ${x + 14},${y} ${x},${y + 14}`}
                      fill="var(--color-gold)" fillOpacity="0.6"
                    />
                  )}
                  {hasContent && (
                    <foreignObject x={x} y={y} width={CELL} height={CELL}>
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 leading-none gap-1">
                        {isAsc && (
                          <span className="text-[10px] font-bold text-rosewood text-center">
                            {ascLabel}
                          </span>
                        )}
                        {signPlanets.map((p, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-slate-800 text-center"
                          >
                            {getLabel(p.name)}
                          </span>
                        ))}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            }),
          )}

          <rect
            x={CELL} y={CELL} width={CELL * 2} height={CELL * 2}
            fill="var(--color-ivory-dark)" fillOpacity="0.3" stroke="none"
          />
          {(title || subtitle) && (
            <foreignObject x={CELL} y={CELL} width={CELL * 2} height={CELL * 2}>
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                {title && <span className="text-sm font-bold text-rosewood text-center">{title}</span>}
                {subtitle && <span className="text-[10px] text-slate-500 text-center">{subtitle}</span>}
              </div>
            </foreignObject>
          )}
          <rect
            x="0" y="0" width={GRID} height={GRID}
            fill="none" stroke="var(--color-gold)" strokeWidth="1.5"
          />
          <rect
            x={CELL} y={CELL} width={CELL * 2} height={CELL * 2}
            fill="none" stroke="var(--color-gold)" strokeWidth="1" strokeOpacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
});
