import React, { useMemo } from 'react';
import BirthChart from './BirthChart';
import type { PlanetData } from '@/types/horoscope';

interface D9ChartProps {
  planets: PlanetData[];
  lagnaNavamsaSignIndex: number;
  title?: string;
  subtitle?: string;
  language?: 'en' | 'ta';
}

export default function D9Chart({ planets, lagnaNavamsaSignIndex, title, subtitle, language }: D9ChartProps) {
  const navamsaPlanets = useMemo(
    () => planets.map((p) => ({ ...p, signIndex: p.navamsaSignIndex })),
    [planets],
  );

  return <BirthChart lagnaSignIndex={lagnaNavamsaSignIndex} planets={navamsaPlanets} title={title} subtitle={subtitle} language={language} />;
}
