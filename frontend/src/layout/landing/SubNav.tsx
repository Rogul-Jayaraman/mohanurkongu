import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useHeader } from '@/hooks/useHeader';

const NAV_ITEMS = [
  {
    id: 'maaligai',
    label: { en: 'Kongu Thirumana Maaligai', ta: 'கொங்கு திருமண மாளிகை' },
    href: '/maaligai',
  },
  {
    id: 'manamaalai',
    label: { en: 'Mohanur Kongu Manamaalai', ta: 'மோகனூர் கொங்கு மணமாலை' },
    href: '/manamaalai/login',
  },
] as const;

export const SubNav: React.FC = () => {
  const { language: lang } = useLanguage();
  const { isScrolled } = useHeader();
  const location = useLocation();

  const activeItem = (() => {
    const path = location.pathname;
    if (path === '/maaligai' || path.startsWith('/maaligai/')) return 'maaligai';
    if (path === '/manamaalai' || path.startsWith('/manamaalai/')) return 'manamaalai';
    return null;
  })();

  if (!isScrolled) return null;

  const isEnglish = lang === 'en';

  return (
    <motion.div
      initial={false}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-[64px] lg:top-[96px] left-0 right-0 z-40 border-b ${
        isScrolled
          ? 'bg-ivory/95 backdrop-blur-md shadow-sm border-rosewood/10'
          : 'bg-transparent border-transparent'
      }`}
    >
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[48px] lg:min-h-[56px] flex items-center justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-y-2 sm:gap-x-6 lg:gap-x-10 xl:gap-x-16 py-1.5 lg:py-2 w-full">
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeItem === item.id;
            return (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <div className="flex items-center justify-center shrink-0 self-center">
                    <div className="w-16 h-px sm:w-px sm:h-7 bg-linear-to-r sm:bg-linear-to-b from-transparent via-gold-500/60 to-transparent rounded-full" />
                  </div>
                )}
                <Link
                  to={item.href}
                  className={`relative flex items-center justify-center px-2 sm:px-3 py-1.5 font-heading font-bold whitespace-nowrap transition-all duration-300 group/link ${
                    isEnglish
                      ? 'text-xs sm:text-sm lg:text-base xl:text-lg tracking-wide'
                      : 'text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base'
                  } ${
                    isActive
                      ? 'text-rosewood'
                      : 'text-rosewood/65 hover:text-rosewood'
                  }`}
                >
                  <span className="relative z-10">
                    {isEnglish ? item.label.en : item.label.ta}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-linear-to-r from-transparent from-5% via-rosewood via-50% to-transparent to-95% transition-all duration-300 ease-in-out rounded-full ${
                      isActive
                        ? 'w-3/4 opacity-100'
                        : 'w-0 opacity-0 group-hover/link:w-3/4 group-hover/link:opacity-100'
                    }`}
                  />
                </Link>
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
};

export default SubNav;
