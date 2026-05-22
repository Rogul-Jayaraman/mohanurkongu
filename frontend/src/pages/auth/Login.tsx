import React from 'react';
import { AuthLayout } from '@/layout/auth/Layout';
import { LoginHero, LoginFormWrapper } from '@/components/features/auth/Login';
import { MatrimonialProfiles } from '@/components/features/auth/MatrimonialProfiles';

const LoginPage: React.FC = () => {
  return (
    <AuthLayout>
      <div className="w-full max-w-[1100px] mx-auto flex flex-col">
        <div className="min-h-[auto] lg:min-h-[520px] relative lg:rounded-[32px] overflow-hidden main-card-shadow flex flex-col lg:flex-row bg-white/95 border border-gold/10">
          <LoginHero />
          <LoginFormWrapper />
          <div className="absolute inset-0 kolam-watermark opacity-[0.03] pointer-events-none z-10" />
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-gold/20 to-transparent my-5 sm:my-6 md:my-8 mx-4 sm:mx-6 md:mx-0" />

        <div className="pb-6 sm:pb-8 md:pb-12">
          <MatrimonialProfiles />
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
