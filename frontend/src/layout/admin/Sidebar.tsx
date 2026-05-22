import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import SidebarLogoTitle from '@/components/ui/layout/SidebarLogoTitle';
import CentralToggleButton from '@/components/ui/forms/CentralToggleButton';

interface SidebarProps {
    isOpen?: boolean;
    setIsOpen?: (v: boolean) => void;
}

interface NavItemProps {
    path?: string;
    label: string;
    icon: string;
    isActive: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    isSubmenu?: boolean;
    isOpen?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ path, label, icon, isActive, onClick, children, isSubmenu, isOpen }) => {
    const Content = (
        <>
            {isActive && !isSubmenu && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-gold rounded-r-full hidden md:block"></div>}
            <span className="material-symbols-outlined text-rosewood text-[24px]">{icon}</span>
            <span className="text-base font-serif font-medium flex-1 text-left">{label}</span>
            {children && (
                <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            )}
        </>
    );

    const className = `relative flex items-center gap-2 px-6 py-3 md:py-4 transition-all rounded-lg w-full ${
        isActive ? 'bg-gold-soft/30 text-rosewood' : 'text-gray-600 hover:bg-rosewood/5'
    }`;

    if (path) {
        return (
            <Link to={path} className={className} onClick={onClick}>
                {Content}
            </Link>
        );
    }

    return (
        <button className={className} onClick={onClick}>
            {Content}
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { language, setLanguage, t } = useLanguage();
    const location = useLocation();
    
    const [matrimonyOpen, setMatrimonyOpen] = useState(false);
    const [mandapamOpen, setMandapamOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const handleLinkClick = () => {
        if (window.innerWidth < 1280) {
            setIsOpen?.(false);
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setIsOpen?.(false)}
                />
            )}
            <aside className={`w-72 bg-ivory border-r border-gold-soft/20 flex flex-col fixed top-0 left-0 h-dvh shadow-lg z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`}>
                <SidebarLogoTitle brandKey="common.brand" taglineKey="common.subtitle" showClose onClose={() => setIsOpen?.(false)} />
                
                {/* Navigation */}
                <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
                    <nav className="px-4 py-4 space-y-2 shrink-0">
                        {/* Dashboard */}
                        <NavItem 
                            path="/admin/dashboard" 
                            label={t('adminLayout.nav.dashboard')} 
                            icon="dashboard" 
                            isActive={isActive('/admin/dashboard')} 
                            onClick={handleLinkClick}
                        />

                        {/* Analytics */}
                        <NavItem 
                            path="/admin/analytics" 
                            label={t('adminLayout.nav.analytics')} 
                            icon="analytics" 
                            isActive={isActive('/admin/analytics')} 
                            onClick={handleLinkClick}
                        />

                        {/* Matrimony Submenu */}
                        <div>
                            <NavItem 
                                label={t('adminLayout.nav.matrimony')} 
                                icon="favorite" 
                                isActive={location.pathname.startsWith('/admin/matrimony')} 
                                onClick={() => setMatrimonyOpen(!matrimonyOpen)}
                                children={true}
                                isOpen={matrimonyOpen}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ${matrimonyOpen ? 'max-h-96 opacity-100 py-1' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-1 border-l border-gold-soft/20 ml-6">

                                    <Link to="/admin/matrimony/membership" className={`flex items-center gap-2 px-6 py-3 md:py-4 text-sm font-serif rounded-md transition-colors ${isActive('/admin/matrimony/membership') ? 'text-rosewood font-medium bg-gold-soft/10' : 'text-gray-500 hover:text-rosewood hover:bg-rosewood/5'}`} onClick={handleLinkClick}>
                                        <span className="material-symbols-outlined text-[18px]">card_membership</span>
                                        <span className="flex-1">{t('adminLayout.nav.plans')}</span>
                                    </Link>
                                    <Link to="/admin/matrimony/verification" className={`flex items-center gap-2 px-6 py-3 md:py-4 text-sm font-serif rounded-md transition-colors ${isActive('/admin/matrimony/verification') ? 'text-rosewood font-medium bg-gold-soft/10' : 'text-gray-500 hover:text-rosewood hover:bg-rosewood/5'}`} onClick={handleLinkClick}>
                                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                        <span className="flex-1">{t('adminLayout.nav.profileVerification')}</span>
                                    </Link>
                                    <Link to="/admin/matrimony/profiles" className={`flex items-center gap-2 px-6 py-3 md:py-4 text-sm font-serif rounded-md transition-colors ${isActive('/admin/matrimony/profiles') ? 'text-rosewood font-medium bg-gold-soft/10' : 'text-gray-500 hover:text-rosewood hover:bg-rosewood/5'}`} onClick={handleLinkClick}>
                                        <span className="material-symbols-outlined text-[18px]">portrait</span>
                                        <span className="flex-1">{t('adminLayout.nav.profiles')}</span>
                                    </Link>
                                    <Link to="/admin/matrimony/users" className={`flex items-center gap-2 px-6 py-3 md:py-4 text-sm font-serif rounded-md transition-colors ${isActive('/admin/matrimony/users') ? 'text-rosewood font-medium bg-gold-soft/10' : 'text-gray-500 hover:text-rosewood hover:bg-rosewood/5'}`} onClick={handleLinkClick}>
                                        <span className="material-symbols-outlined text-[18px]">group</span>
                                        <span className="flex-1">{t('adminLayout.nav.userAccounts')}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Mandapam Submenu */}
                        <div>
                            <NavItem 
                                label={t('adminLayout.nav.mandapam')} 
                                icon="home_work" 
                                isActive={location.pathname.startsWith('/admin/mandapam')} 
                                onClick={() => setMandapamOpen(!mandapamOpen)}
                                children={true}
                                isOpen={mandapamOpen}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ${mandapamOpen ? 'max-h-64 opacity-100 py-1' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-1 border-l border-gold-soft/20 ml-6">
                                    <Link to="/admin/mandapam/packages" className={`flex items-center gap-2 px-6 py-3 md:py-4 text-sm font-serif rounded-md transition-colors ${isActive('/admin/mandapam/packages') ? 'text-rosewood font-medium bg-gold-soft/10' : 'text-gray-500 hover:text-rosewood hover:bg-rosewood/5'}`} onClick={handleLinkClick}>
                                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                                        <span className="flex-1">{t('adminLayout.nav.packages')}</span>
                                    </Link>
                                    <Link to="/admin/mandapam/availability" className={`flex items-center gap-2 px-6 py-3 md:py-4 text-sm font-serif rounded-md transition-colors ${isActive('/admin/mandapam/availability') ? 'text-rosewood font-medium bg-gold-soft/10' : 'text-gray-500 hover:text-rosewood hover:bg-rosewood/5'}`} onClick={handleLinkClick}>
                                        <span className="material-symbols-outlined text-[18px]">event_available</span>
                                        <span className="flex-1">{t('adminLayout.nav.hallAvailability')}</span>
                                    </Link>
                                    <Link to="/admin/mandapam/bookings" className={`flex items-center gap-2 px-6 py-3 md:py-4 text-sm font-serif rounded-md transition-colors ${isActive('/admin/mandapam/bookings') ? 'text-rosewood font-medium bg-gold-soft/10' : 'text-gray-500 hover:text-rosewood hover:bg-rosewood/5'}`} onClick={handleLinkClick}>
                                        <span className="material-symbols-outlined text-[18px]">book_online</span>
                                        <span className="flex-1">{t('adminLayout.nav.bookings')}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        <NavItem 
                            path="/admin/settings" 
                            label={t('adminLayout.nav.settings')} 
                            icon="settings" 
                            isActive={isActive('/admin/settings')} 
                            onClick={handleLinkClick}
                        />
                    </nav>

                    {/* Footer / Language Switcher */}
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
                                        { value: 'ta', label: { en: 'Tamil', ta: 'தமிழ்' } },
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
