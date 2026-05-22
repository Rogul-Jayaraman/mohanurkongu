import React from 'react';
import { Hero } from '@/components/features/landing/Hero';
import { OfficeBearers } from '@/components/features/landing/OfficeBearers';
import Payment from '@/components/features/landing/Payment';
import { LandingTemplate } from '@/layout/landing/Layout';

export default function LandingPage() {
  return (
    <LandingTemplate
      hero={<Hero />}
      sections={[
        <div className="h-px bg-linear-to-r from-transparent via-gold/20 to-transparent max-w-2xl mx-auto w-full" />,
        <OfficeBearers />,
        <div className="h-px bg-linear-to-r from-transparent via-gold/20 to-transparent max-w-2xl mx-auto w-full" />,
        <Payment />,
      ]}
    />
  );
}
