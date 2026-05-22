import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '@/assets/images/logo.png';
import CentralToggleButton from '@/components/ui/forms/CentralToggleButton';

export const AuthHeader: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();

    return (
        <header className="sticky top-0 z-50 header-premium">
            <div className="header-premium-container px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between relative gap-4">
                
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-3 group py-2">
                    <motion.img 
                        src={logoImg}
                        alt="Mohanur Kongu Logo"
                        className="h-10 md:h-14 w-auto rounded-full border-2 border-gold/20 shadow-sm md:shadow-md group-hover:scale-110 transition-transform duration-500 "
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    />
                    <div className="flex flex-row items-baseline gap-2">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div 
                                key={language}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex md:flex-row flex-col gap-1"
                            >
                                <h1 className={`font-serif font-bold text-rosewood leading-none group-hover:text-dark-rosewood/80 transition-all whitespace-nowrap  ${
                                    language === 'ta' ? 'text-sm lg:text-lg' : 'text-sm lg:text-lg'
                                }`}>
                                    {t('brand')}
                                </h1>
                                <p className={`font-serif font-bold text-rosewood leading-none group-hover:text-dark-rosewood/80 transition-all whitespace-nowrap  ${
                                    language === 'ta' ? 'text-sm lg:text-lg' : 'text-sm lg:text-lg'
                                }`}>
                                    {t('tagline')}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Link>

                {/* Language Switcher */}
                <div className="flex items-center shrink-0">
                    <CentralToggleButton
                        name="authLang"
                        value={language}
                        onChange={(v) => setLanguage(v as 'en' | 'ta')}
                        variant="rosewood"
                        options={[
                            { value: 'en', label: { en: 'English', ta: 'English' } },
                            { value: 'ta', label: { en: 'தமிழ்', ta: 'தமிழ்' } },
                        ]}
                    />
                </div>

                <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
            </div>
        </header>
    );
};
