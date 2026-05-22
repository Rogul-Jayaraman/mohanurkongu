import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';

const NotFound: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-ivory flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-soft/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rosewood/5 rounded-full blur-3xl"></div>

            <div className="max-w-md w-full text-center relative z-10">
                {/* 404 Large Text */}
                <div className="text-[120px] md:text-[180px] font-serif font-bold text-rosewood/10 leading-none select-none">
                    404
                </div>
                
                {/* Content Card */}
                <div className="bg-white/40 backdrop-blur-xl border border-gold-soft/20 rounded-3xl p-8 md:p-12 shadow-2xl -mt-16 md:-mt-24">
                    <span className="material-symbols-outlined text-gold text-6xl mb-6 inline-block animate-bounce">
                        explore_off
                    </span>
                    
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-rosewood mb-4">
                        {t('common.notFound.title')}
                    </h1>
                    
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {t('common.notFound.desc')}
                    </p>
                    
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-br from-rosewood/80 via-dark-rosewood/95 to-rosewood/80 text-white rounded-xl font-serif font-bold shadow-lg shadow-rosewood/20 hover:shadow-xl hover:shadow-rosewood/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                        <span className="material-symbols-outlined text-lg">home</span>
                        {t('common.notFound.backHome')}
                    </Link>
                </div>
                
                {/* Branding Footer */}
                <div className="mt-12">
                    <div className="flex items-center justify-center gap-2 text-rosewood/50 mb-1">
                        <span className="w-8 h-px bg-rosewood/20"></span>
                        <span className="text-sm font-serif font-bold tracking-widest uppercase">
                            {t('common.brand')}
                        </span>
                        <span className="w-8 h-px bg-rosewood/20"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;

