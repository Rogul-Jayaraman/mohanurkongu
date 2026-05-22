import React from 'react';
import { motion } from 'framer-motion';
import { AdminLoginForm, adminLoginContainerVariants, adminLoginItemVariants } from '@/components/forms/auth/AdminLoginForm';
import { useTranslations } from '@/hooks/useTranslations';

/**
 * AdminLoginFormWrapper – visual container for the admin login form with header and styling.
 */
export const AdminLoginFormWrapper: React.FC = () => {
    const { t } = useTranslations(['adminLogin', 'errors']);

    return (
        <motion.div
            variants={adminLoginContainerVariants}
            initial="hidden"
            animate="visible"
            className="w-full mt-8 p-6 sm:p-10 lg:p-14 rounded-premium relative z-10 overflow-hidden bg-white/95 border border-gold/20 shadow-2xl"
        >
            <div className="text-center mb-10">
                <motion.div variants={adminLoginItemVariants} className="flex justify-center mb-4">
                    <div className="p-3 bg-rosewood/5 rounded-full">
                        <span className="material-symbols-outlined text-rosewood text-4xl">admin_panel_settings</span>
                    </div>
                </motion.div>

                <motion.h2 variants={adminLoginItemVariants} className="font-serif text-3xl font-bold text-dark-brown mb-2">
                    {t('title')}
                </motion.h2>
                <motion.p variants={adminLoginItemVariants} className="text-logo-dark font-medium text-sm">
                    {t('subtitle')}
                </motion.p>
            </div>

            <AdminLoginForm />
        </motion.div>
    );
};
