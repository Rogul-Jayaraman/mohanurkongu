import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import loginHeroImg from '@/assets/images/auth/login_hero.png';
import { LoginForm, loginContainerVariants, loginItemVariants } from '@/components/forms/auth/LoginForm';
import { useTranslations } from '@/hooks/useTranslations';

/**
 * LoginHero – visual hero section for the login page (60% width).
 */
export const LoginHero: React.FC = () => {
    const { t, language } = useTranslations(['auth']);
    const isTamil = language === 'ta';

    return (
        <section className="hidden lg:flex relative w-[50%] p-6 flex-col items-center justify-center overflow-hidden ">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative w-full h-full rounded-premium overflow-hidden border border-gold/40 shadow-xl"
            >
                <img
                    alt="Traditional South Indian Wedding"
                    className="absolute inset-0 object-cover h-full w-full"
                    src={loginHeroImg}
                />

                <div className="hero-overlay absolute inset-0"></div>

                <div className="ornament-corner absolute top-6 left-6 opacity-80"></div>
                <div className="ornament-corner absolute top-6 right-6 rotate-90 opacity-80"></div>
                <div className="ornament-corner absolute bottom-6 right-6 rotate-180 opacity-80"></div>
                <div className="ornament-corner absolute bottom-6 left-6 -rotate-90 opacity-80"></div>

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto px-12 text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                         <span className="material-symbols-outlined text-gold text-4xl! mb-2 drop-shadow-md">temple_hindu</span>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`font-script text-gold drop-shadow-md ${
                            isTamil ? 'text-2xl lg:text-3xl' : 'text-3xl lg:text-4xl'
                        }`}
                    >
                        {t('login.hero.tags')}
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className={`font-serif font-bold leading-tight drop-shadow-lg ${
                            isTamil ? 'text-2xl lg:text-3xl' : 'text-3xl lg:text-4xl'
                        }`}
                    >
                        {t('login.hero.title')}
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="h-[2px] w-full bg-linear-to-r from-transparent via-gold/40 to-transparent my-4"
                    ></motion.div>

                    <div className="grid grid-cols-3 gap-8 pt-3">
                        {[
                            { icon: 'verified', label: t('login.hero.feat1') },
                            { icon: 'lock', label: t('login.hero.feat2') },
                            { icon: 'group', label: t('login.hero.feat3') }
                        ].map((item, index) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1 + index * 0.1 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full border border-gold/40 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                                    <span className="material-symbols-outlined text-gold text-3xl font-variation-medium">{item.icon}</span>
                                </div>
                                <span className={`font-bold text-white drop-shadow-sm ${
                                    isTamil ? 'text-[9px] tracking-normal' : 'text-[10px] tracking-[0.2em] uppercase'
                                }`}>
                                    {item.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

/**
 * LoginFormWrapper – visual container with glass-card, ornaments, and the login form (40% width).
 */
export const LoginFormWrapper: React.FC = () => {
    const { t, language } = useTranslations(['auth']);
    const isTamil = language === 'ta';

    return (
        <section className="w-full lg:w-[50%] flex items-center justify-center lg:px-6 lg:py-6 md:py-8 relative bg-gold-soft/10 min-h-[auto] lg:min-h-[520px]">
            <div className="absolute inset-0 kolam-watermark pointer-events-none opacity-[0.25]"></div>
                <div className="ornament-corner absolute top-8 left-8 opacity-40 hidden lg:block"></div>
                <div className="ornament-corner absolute top-8 right-8 rotate-90 opacity-40 hidden lg:block"></div>
                <div className="ornament-corner absolute bottom-8 right-8 rotate-180 opacity-40 hidden lg:block"></div>
                <div className="ornament-corner absolute bottom-8 left-8 -rotate-90 opacity-40 hidden lg:block"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="glass-card w-full max-w-[500px] p-6 sm:p-8 lg:py-8 lg:px-14 rounded-premium relative z-10 overflow-hidden shadow-sm"
            >

                <motion.div
                    variants={loginContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center mb-3 sm:mb-4"
                >
                    <motion.div variants={loginItemVariants} className="flex justify-center mb-1 sm:mb-2">
                        <span className="material-symbols-outlined text-rosewood text-3xl sm:text-4xl">grass</span>
                    </motion.div>

                    <motion.h2 variants={loginItemVariants} className={`font-serif font-bold text-dark-brown mb-1 sm:mb-2 ${isTamil ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>{t('login.title')}</motion.h2>
                    <motion.p variants={loginItemVariants} className={`text-logo-dark font-medium ${isTamil ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'}`}>{t('login.subtitle')}</motion.p>
                </motion.div>

                <LoginForm />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.03 }}
                    className="relative my-6 sm:my-8"
                >
                    <div className="h-px w-full bg-gold/20"></div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white/95 px-3 sm:px-4 text-[9px] sm:text-[10px] uppercase font-bold text-logo-dark tracking-[0.3em] rounded-full border border-gold/10">{t('login.or')}</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.04 }}
                >
                    <Link to="/manamaalai/signup" className="block w-full py-3.5 sm:py-4 mb-2 sm:mb-4 border-2 border-gold/40 bg-linear-to-r from-gold/15 via-gold/5 to-gold/15 text-rosewood hover:bg-linear-to-r hover:from-gold/5 hover:via-gold/15 hover:to-gold/5 font-bold rounded-xl transition-all cursor-pointer text-sm sm:text-base text-center">
                        {t('login.newAccount')}
                    </Link>
                </motion.div>
            </motion.div>
        </section>
    );
};
