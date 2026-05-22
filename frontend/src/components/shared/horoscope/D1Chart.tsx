import React from 'react';
import BirthChart from './BirthChart';
import type { PlanetData } from '@/types/horoscope';

interface D1ChartProps {
  lagnaSign: number;
  planets: PlanetData[];
  title?: string;
  subtitle?: string;
  language?: 'en' | 'ta';
}

export default function D1Chart({ lagnaSign, planets, title, subtitle, language }: D1ChartProps) {
  return <BirthChart lagnaSignIndex={lagnaSign} planets={planets} title={title} subtitle={subtitle} language={language} />;
}
