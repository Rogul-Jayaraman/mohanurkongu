import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

interface FooterLinkProps {
    label: string;
    isPrimary?: boolean;
}

export const Footer: React.FC = () => {
    const { language: lang } = useLanguage();
    const { t } = useTranslation('landing');
    const currentYear = new Date().getFullYear();

    return (
        <footer 
            id="contact" 
            className="py-12 flex flex-col items-center px-6 md:px-12 glass-dark justify-center text-xs text-ivory/80 tracking-widest uppercase border-t border-rosewood/10 relative z-20 snap-start"
        >
            <div className={`mb-6 font-body ${lang === "ta" ? "text-tiny" : ""}`}>
                {t('footer.est')}
            </div>

            <div className={`flex gap-8 font-body font-semibold ${lang === "ta" ? "text-tiny" : ""}`}>
                <FooterLink label={t('footer.links.privacy')} />
                <FooterLink label={t('footer.links.terms')} />
                <FooterLink label={t('footer.links.contact')} isPrimary />
            </div>

            <div className="mt-8 text-tiny opacity-60">
                &copy; {currentYear} {t('footer.copyright')}
            </div>
        </footer>
    );
};

const FooterLink: React.FC<FooterLinkProps> = ({ label, isPrimary }) => (
    <span className={`transition-colors cursor-pointer ${
        isPrimary 
            ? 'text-gold-500 border-b border-gold-500/50 pb-0.5 hover:text-gold-400' 
            : 'hover:text-gold-500'
    }`}>
        {label}
    </span>
);

export default Footer;
