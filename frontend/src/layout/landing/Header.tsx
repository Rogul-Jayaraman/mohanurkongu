import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useHeader } from '@/hooks/useHeader';
import logo from '@/assets/images/logo.png';
import { SmoothText } from '@/components/animations/SmoothText';
import CentralToggleButton from '@/components/ui/forms/CentralToggleButton';

interface HeaderLogoProps {
    isScrolled: boolean;
    closeAll: () => void;
}

interface HeaderTitleProps {
    isScrolled: boolean;
    lang: string;
}

interface HeaderLanguageSwitcherProps {
    lang: string;
    handleLangChange: (value: string) => void;
}

export const Header: React.FC = () => {
    const { language: lang, setLanguage: setLang } = useLanguage();

    const {
        isScrolled,
        isVisible,
        closeAll
    } = useHeader();

    const handleLangChange = (newLang: string) => {
        setLang(newLang as 'en' | 'ta');
    };

    return (
        <motion.header
            initial={false}
            animate={{ y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 w-full z-50 border-b header-optimized ${isScrolled
                    ? 'bg-ivory/95 lg:py-2 backdrop-blur-md shadow-sm border-rosewood/10'
                    : 'bg-transparent py-4 border-transparent'
                }`}
        >
            <nav aria-label="Site header" className="max-w-7xl mx-auto px-3 sm:px-6 relative flex items-center justify-between min-h-[64px] lg:min-h-[80px]">
                <HeaderLogo isScrolled={isScrolled} closeAll={closeAll} />
                <HeaderTitle isScrolled={isScrolled} lang={lang} />
                <HeaderLanguageSwitcher
                    lang={lang}
                    handleLangChange={handleLangChange}
                />
            </nav>
        </motion.header>
    );
};

const HeaderLogo: React.FC<HeaderLogoProps> = ({ isScrolled, closeAll }) => {
    return (
        <div className="flex-none w-12 sm:w-16 lg:w-28 flex justify-start z-10">
            <Link to="/" className="group flex items-center" onClick={() => { closeAll(); window.scrollTo(0, 0); }}>
                <div className={`relative shrink-0 ${isScrolled ? 'w-8 h-8 md:w-10 md:h-10 lg:w-16 lg:h-16' : 'w-10 h-10 md:w-12 md:h-12 lg:w-22 lg:h-22'
                    }`} style={{ transition: 'width 0.3s ease, height 0.3s ease' }}>
                    <img
                        src={logo}
                        alt="Mohanur Kongu Logo"
                        className="w-full h-full object-cover rounded-full border border-gold-500/20 shadow-sm group-hover:border-gold-500/40 transition-colors"
                    />
                </div>
            </Link>
        </div>
    );
};

const HeaderTitle: React.FC<HeaderTitleProps> = ({ isScrolled, lang }) => {
    const { i18n } = useTranslation();

    const textPrimary = i18n.t('landing:header.community', { lng: lang });
    const textSecondary = i18n.t('landing:header.community', { lng: lang === 'en' ? 'ta' : 'en' });
    const registration = i18n.t('landing:header.registration', { lng: lang });

    return (
        <Link
            to="/"
            className="flex-1 min-w-[80px] flex flex-col items-center justify-center text-center overflow-hidden px-2 sm:px-4 group/title cursor-pointer"
            onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
        >
            {/* textPrimary — main community name */}
            <div className="w-full flex nav:justify-center overflow-hidden mask-fade-h nav:mask-none">
                <div className="w-max flex animate-marquee nav:animate-none" style={{ willChange: 'transform' }}>
                    <span className={`font-heading font-bold text-rosewood transition-[font-size] duration-300 leading-tight whitespace-nowrap pl-4 pr-4 sm:pr-12 nav:pr-0 nav:px-0 ${isScrolled ? 'text-[0.6rem] sm:text-sm lg:text-lg' : 'text-[0.7rem] sm:text-base lg:text-xl'
                        }`}>
                        <span className="nav:hidden">{textPrimary}</span>
                        <div className="hidden nav:block">
                            <SmoothText
                                text={textPrimary}
                                stagger={0.02}
                                duration={0.5}
                                delay={0.2}
                                y={10}
                                animKey={lang === 'en' ? 1 : 2}
                            />
                        </div>
                    </span>
                    <span className={`font-heading font-bold text-rosewood transition-[font-size] duration-300 leading-tight whitespace-nowrap pr-4 sm:pr-12 nav:hidden ${isScrolled ? 'text-[0.6rem] sm:text-sm lg:text-lg' : 'text-[0.7rem] sm:text-base lg:text-xl'
                        }`} aria-hidden="true">
                        {textPrimary}
                    </span>
                </div>
            </div>

            {/* textSecondary — other language */}
            <div className="w-full flex nav:justify-center overflow-hidden mask-fade-h nav:mask-none">
                <div className="w-max flex animate-marquee nav:animate-none" style={{ willChange: 'transform' }}>
                    <span className={`font-heading text-rosewood/80 transition-[font-size] duration-300 leading-tight whitespace-nowrap pl-4 pr-4 sm:pr-12 nav:pr-0 nav:px-0 ${isScrolled ? 'text-nano md:text-tiny lg:text-xs' : 'text-[0.55rem] md:text-xs-tight lg:text-sm'
                        }`}>
                        <span className="nav:hidden">{textSecondary}</span>
                        <div className="hidden nav:block">
                            <SmoothText
                                text={textSecondary}
                                stagger={0.015}
                                duration={0.5}
                                delay={0.4}
                                y={8}
                                animKey={lang === 'en' ? 3 : 4}
                            />
                        </div>
                    </span>
                    <span className={`font-heading text-rosewood/80 transition-[font-size] duration-300 leading-tight whitespace-nowrap pr-4 sm:pr-12 nav:hidden ${isScrolled ? 'text-nano md:text-tiny lg:text-xs' : 'text-[0.55rem] md:text-xs-tight lg:text-sm'
                        }`} aria-hidden="true">
                        {textSecondary}
                    </span>
                </div>
            </div>

            {/* registration */}
            <div className={`w-full flex nav:justify-center overflow-hidden transition-[margin] duration-300 mask-fade-h nav:mask-none ${isScrolled ? 'mt-0.5' : 'mt-1'
                }`}>
                <div className="w-max flex animate-marquee nav:animate-none" style={{ willChange: 'transform' }}>
                    <span className={`font-heading font-medium tracking-wider text-rosewood transition-[font-size] duration-300 leading-tight whitespace-nowrap pl-4 pr-4 sm:pr-12 nav:pr-0 nav:px-0 ${isScrolled ? 'text-micro md:text-nano lg:text-tiny' : 'text-nano md:text-micro lg:text-xs-tight'
                        }`}>
                        <span className="nav:hidden">{registration}</span>
                        <div className="hidden nav:block">
                            <SmoothText
                                text={registration}
                                stagger={0.02}
                                duration={0.5}
                                delay={0.3}
                                y={6}
                                animKey={lang === 'en' ? 5 : 6}
                            />
                        </div>
                    </span>
                    <span className={`font-heading font-medium tracking-wider text-rosewood transition-[font-size] duration-300 leading-tight whitespace-nowrap pr-4 sm:pr-12 nav:hidden ${isScrolled ? 'text-micro md:text-nano lg:text-tiny' : 'text-nano md:text-micro lg:text-xs-tight'
                        }`} aria-hidden="true">
                        {registration}
                    </span>
                </div>
            </div>
        </Link>
    );
};

const HeaderLanguageSwitcher: React.FC<HeaderLanguageSwitcherProps> = ({
    lang,
    handleLangChange
}) => {
    return (
        <div className="flex-none w-12 sm:w-16 lg:w-28 flex justify-end z-10">
            <CentralToggleButton
                name="landingLang"
                value={lang}
                onChange={handleLangChange}
                variant="rosewood"
                glass={true}
                options={[
                    { value: 'en', label: { en: 'English', ta: 'English' } },
                    { value: 'ta', label: { en: 'தமிழ்', ta: 'தமிழ்' } },
                ]}
            />
        </div>
    );
};

export default Header;
