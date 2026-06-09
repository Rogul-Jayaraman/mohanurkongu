import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useHeader } from '@/hooks/useHeader';
import logo from '@/assets/images/logo.png';
import CentralToggleButton from '@/components/ui/forms/CentralToggleButton';

export const Header: React.FC = () => {
  const { language: lang, setLanguage: setLang } = useLanguage();
  const isTamil = lang === 'ta';
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    isScrolled: scrolled,
    isVisible,
    isMobileMenuOpen: isMenuOpen,
    toggleMobileMenu,
    closeAll
  } = useHeader();
  
  const { t } = useTranslation('maaligai');
  
  const ls = (en: string, ta: string) => isTamil ? ta : en;

  const navItems = [
    { id: 'home', label: t('footer.nav.home') || 'Home', icon: 'home', path: '/maaligai' },
    { id: 'about', label: t('footer.nav.about') || 'About', icon: 'info', path: '/maaligai/about' },
    { id: 'facilities', label: t('footer.nav.facilities') || 'Facilities', icon: 'layers', path: '/maaligai/facilities' },
    { id: 'gallery', label: t('footer.nav.gallery') || 'Gallery', icon: 'photo_library', path: '/maaligai/gallery' },
    { id: 'packages', label: t('footer.nav.packages') || 'Packages', icon: 'calendar_today', path: '/maaligai/packages' },
    { id: 'hall-availability', label: t('footer.nav.hallAvailability') || 'Hall Availability', icon: 'event_available', path: '/maaligai/hall-availability' },
    { id: 'contact', label: t('footer.nav.contact') || 'Contact', icon: 'contact_support', path: '/maaligai/contact' },
  ];
  
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/maaligai') return 'home';
    const subPath = path.replace('/maaligai/', '');
    if (subPath === 'packages') return 'packages';
    if (subPath === 'hall-availability') return 'hall-availability';
    return subPath;
  };
  const currentPage = getCurrentPage();
  
  const handleNavigate = (path: string) => {
    navigate(path);
    closeAll();
    window.scrollTo(0, 0);
  };
  
  return (
    <motion.header 
      initial={false}
      animate={{ y: isVisible ? 0 : '-100%' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 w-full z-50 bg-ivory header-optimized px-4 md:px-6 lg:px-20 py-3 md:py-4 flex items-center justify-between ${scrolled ? 'shadow-md py-2 md:py-3' : 'border-b border-rosewood/20'}`}
    >
      <Link to="/" className="flex items-center gap-2 md:gap-3 z-50 group" onClick={() => closeAll()}>
        <img src={logo} alt="Logo" className="h-10 md:h-12 w-auto transition-transform duration-500 group-hover:scale-105" />
        <h1 className={`${isTamil ? 'font-tamil-serif' : 'font-heading'} text-base md:text-xl font-bold text-rosewood tracking-tight truncate max-w-[180px] md:max-w-none`}>
          {t('home.hero.title')}
        </h1>
      </Link>
      
      <nav className="hidden xl:flex items-center gap-8 font-body">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`text-sm font-semibold transition-all duration-300 relative group/link ${currentPage === item.id ? 'text-rosewood font-bold scale-105' : 'text-dark-brown/70 hover:text-rosewood'}`}
          >
            {item.label}
            <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-[1.3px] bg-linear-to-r from-transparent from-2% via-rosewood via-50% to-transparent to-98% transition-all duration-400 ease-in-out ${currentPage === item.id ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover/link:w-full group-hover/link:opacity-100'}`}></span>
          </Link>
        ))}
      </nav>
      
      <div className="flex items-center gap-3 md:gap-6">
        <div className="h-6 w-px bg-gray-300 hidden xl:block" />
        
        <div className="hidden md:block">
          <CentralToggleButton
            name="maaligaiLang"
            value={lang}
            onChange={(v) => setLang(v as 'en' | 'ta')}
            variant="rosewood"
            glass={true}
            options={[
              { value: 'en', label: { en: 'EN', ta: 'EN' } },
              { value: 'ta', label: { en: 'த', ta: 'த' } },
            ]}
          />
        </div>
        
        <button
          onClick={toggleMobileMenu}
          className="xl:hidden flex items-center justify-center w-12 h-12 z-60 transition-all duration-300 hover:scale-110 active:scale-90"
        >
          <span className="material-symbols-outlined text-3xl! text-rosewood">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-ivory z-50 xl:hidden overflow-hidden"
          >
            <div className="absolute inset-0 kolam-pattern opacity-[0.05] pointer-events-none"></div>

            <div className="flex flex-col h-full relative z-10 pt-24 pb-20 px-8 sm:px-16 overflow-y-auto no-scrollbar">
              <div className="flex flex-col items-center mb-10 shrink-0">
                <img src={logo} alt="Logo" className="h-14 w-auto mb-3 opacity-90" />
                <div className="flex items-center gap-4 w-full justify-center">
                  <div className="h-[0.5px] flex-1 bg-linear-to-r from-transparent to-rosewood/40"></div>
                  <p className={`${isTamil ? 'font-tamil-serif' : 'font-heading'} text-base text-rosewood font-bold tracking-tight`}>
                    {t('home.hero.title')}
                  </p>
                  <div className="h-[0.5px] flex-1 bg-linear-to-l from-transparent to-rosewood/40"></div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 mb-10">
                {navItems.map((item, idx) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    onClick={() => handleNavigate(item.path)}
                    className={`flex items-center gap-6 py-4 px-6 rounded-2xl transition-all duration-500 border border-transparent ${currentPage === item.id ? 'bg-white shadow-lg border-rosewood/30' : 'hover:bg-white/50'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${currentPage === item.id ? 'bg-rosewood text-white' : 'bg-rosewood/10 text-rosewood'}`}>
                      <span className="material-symbols-outlined text-2xl!">{item.icon}</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`font-bold transition-all duration-300 ${isTamil ? 'font-tamil-body tracking-normal' : 'font-body tracking-wide'} text-base ${currentPage === item.id ? 'text-rosewood' : 'text-dark-brown/70'}`}>
                        {item.label}
                      </span>
                      <div className={`h-[1.5px] transition-all duration-500 bg-linear-to-r from-transparent via-rosewood to-transparent mx-auto ${currentPage === item.id ? 'w-full' : 'w-0'}`}></div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="shrink-0 space-y-8 flex flex-col items-center">
                <div className="flex items-center p-1.5 bg-white/60 backdrop-blur-xl rounded-full border border-rosewood/20 shadow-sm max-w-[280px] w-full">
                  <button
                    onClick={() => { setLang('en'); closeAll(); }}
                    className={`flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-widest-plus transition-all duration-500 ${lang === 'en' ? 'bg-rosewood text-white shadow-md' : 'text-gray-400 hover:text-rosewood'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLang('ta'); closeAll(); }}
                    className={`flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-widest-plus transition-all duration-500 ${lang === 'ta' ? 'bg-rosewood text-white shadow-md' : 'text-gray-400 hover:text-rosewood'}`}
                  >
                    தமிழ்
                  </button>
                </div>

                <p className={`${isTamil ? 'font-tamil-body' : 'font-cursive'} text-xl text-rosewood opacity-60 text-center`}>
                  {lang === 'en' ? 'Crafting timeless memories' : 'காலத்தால் அழியாத நினைவுகள்'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
