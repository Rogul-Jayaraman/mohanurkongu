import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatFullName, getInitials } from '../../utils/formatName';

interface HeaderProps {
    onMenuClick: () => void;
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();

    return (
        <header className="sticky top-0 z-30 h-16 md:h-20 bg-ivory/80 backdrop-blur-md border-b border-gold-soft/10 px-4 md:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <button 
                  onClick={onMenuClick} 
                  className="xl:hidden p-2 -ml-2 text-rosewood hover:bg-gold-soft/10 rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="flex flex-col">
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-rosewood leading-tight truncate max-w-[200px] md:max-w-none">
                        {t(title)}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-6">


                <div className="flex items-center gap-3 pl-2 md:pl-6 border-l border-gold-soft/10">
                    {/* Admin Profile Pill */}
                    <div className="hidden md:flex items-center gap-3 bg-gold-soft/5 px-4 py-1.5 rounded-full border border-gold-soft/10">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-serif font-bold text-rosewood leading-tight">
                                {formatFullName(user?.firstNameEn, user?.lastNameEn) || 'Administrator'}
                            </span>
                            {user && 'customId' in user && user.customId && (
                                <span className="text-[9px] text-gold font-bold uppercase tracking-wider">
                                    {(user as any).customId}
                                </span>
                            )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-rosewood to-dark-rosewood flex items-center justify-center text-ivory text-xs font-bold border border-gold/30 shadow-sm">
                            {getInitials(user?.firstNameEn, user?.lastNameEn)}
                        </div>
                    </div>

                    <button 
                        onClick={logout}
                        className="group flex items-center justify-center md:gap-2 w-10 h-10 md:w-auto md:h-11 md:px-5 rounded-full bg-linear-to-br from-ivory to-gold/40 hover:from-rosewood hover:to-dark-rosewood border border-gold/30 hover:border-rosewood transition-all duration-500 shadow-sm hover:shadow-lg hover:shadow-rosewood/30"
                        title={t('common.logout')}
                    >
                        <span className="material-symbols-outlined text-rosewood group-hover:text-gold text-[22px] md:text-[20px] transition-all duration-500 transform">
                            logout
                        </span>
                        <span className="hidden md:inline text-[13px] font-serif font-black text-rosewood group-hover:text-gold transition-colors duration-500 tracking-wide">
                            {t('common.logout')}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
