import React from 'react';
import { AuthLayout } from '@/layout/auth/Layout';
import { SignupHero, SignupFormWrapper } from '@/components/features/auth/Signup';

/**
 * Premium Signup Page
 * Grouped under pages/auth/
 */
const SignupPage: React.FC = () => {
    return (
        <AuthLayout>
            <div className="w-full max-w-[1240px] mx-auto min-h-[600px] lg:min-h-[850px] relative rounded-[40px] overflow-hidden main-card-shadow flex flex-col lg:flex-row bg-white/95 border border-gold/10">
                <SignupHero />
                <SignupFormWrapper />
                <div className="absolute inset-0 kolam-watermark opacity-[0.03] pointer-events-none z-10" />
            </div>
        </AuthLayout>
    );
};

export default SignupPage;
