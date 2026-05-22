import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import SidebarLogoTitle from '@/components/ui/layout/SidebarLogoTitle';
import CentralToggleButton from '@/components/ui/forms/CentralToggleButton';

interface SidebarProps {
    isOpen?: boolean;
    setIsOpen?: (v: boolean) => void;
    disabled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, disabled }) => {
    const { language, setLanguage, t } = useLanguage();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        { path: '/manamaalai/dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
        { path: '/manamaalai/browse-profiles', label: t('nav.browse_profiles'), icon: 'person_search' },
        { path: '/manamaalai/shortlist', label: t('nav.shortlist'), icon: 'favorite' },
        { path: '/manamaalai/my-profiles', label: t('nav.my_profiles'), icon: 'person' },
        { path: '/manamaalai/my-account', label: t('nav.myAccount') || 'My Account', icon: 'settings' },
    ];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setIsOpen?.(false)}
                />
            )}
            <aside className={`w-72 bg-ivory border-r border-gold-soft/20 flex flex-col fixed top-0 left-0 h-dvh shadow-lg z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`}>
                <SidebarLogoTitle showClose onClose={() => setIsOpen?.(false)} />
                
                <div className="md:mt-[-30px] flex-1 overflow-y-auto flex flex-col no-scrollbar">
                    <nav className="px-4 py-4 space-y-1 shrink-0">
                        <div className="space-y-2 py-2 md:py-6">
                            {menuItems.map((item) => (
                                <Link 
                                    key={item.path}
                                    onClick={(e) => {
                                        if (disabled) {
                                            e.preventDefault();
                                            return;
                                        }
                                        setIsOpen?.(false);
                                    }} 
                                    to={disabled ? '#' : item.path} 
                                    className={`relative flex items-center gap-4 px-6 py-3 md:py-4 transition-all rounded-lg ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : isActive(item.path) ? 'bg-gold-soft/30 text-rosewood' : 'text-gray-600 hover:bg-rosewood/5'}`}
                                >
                                    {isActive(item.path) && !disabled && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-gold rounded-r-full hidden md:block"></div>}
                                    <span className="material-symbols-outlined text-rosewood text-[24px]">{item.icon}</span>
                                    <span className="text-base font-serif font-semibold">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>

                    <div className="mt-auto flex flex-col shrink-0">
                        <div className="p-6 pb-8 flex flex-col gap-4">
                            <div className="px-2 border-t border-gold-soft/10 pt-6">
                                <CentralToggleButton
                                    name="sidebarLang"
                                    value={language}
                                    onChange={(v) => setLanguage(v as 'en' | 'ta')}
                                    variant="rosewood"
                                    fullWidth
                                    options={[
                                        { value: 'en', label: { en: 'English', ta: 'English' } },
                                        { value: 'ta', label: { en: 'தமிழ்', ta: 'தமிழ்' } },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
