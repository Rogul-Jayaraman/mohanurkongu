import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const NAV_KEYS: { id: string; key: string }[] = [
  { id: 'basic', key: 'basic' },
  { id: 'personal', key: 'personal' },
  { id: 'community', key: 'community' },
  { id: 'professional', key: 'professional' },
  { id: 'family', key: 'family' },
  { id: 'assets', key: 'assets' },
  { id: 'contact', key: 'contact' },
  { id: 'horoscope', key: 'horoscope' },
  { id: 'gallery', key: 'gallery' },
  { id: 'partner-preference', key: 'partner_preference' },
];

const QuickNav: React.FC = () => {
  const [activeSection, setActiveSection] = useState('');
  const { t } = useTranslation(['common']);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActiveSection(id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    NAV_KEYS.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="no-print relative">
      <div className="flex items-center h-11 sm:h-12 overflow-x-auto overflow-y-hidden scrollbar-hide sm:overflow-visible">
        {NAV_KEYS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`relative flex-shrink-0 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest-plus transition-colors whitespace-nowrap ${
                isActive ? 'text-rosewood' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t(`common:nav.${s.key}`, { defaultValue: s.key })}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-rosewood rounded-full" />
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default QuickNav;
