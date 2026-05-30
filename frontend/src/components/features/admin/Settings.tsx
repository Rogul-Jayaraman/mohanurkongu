import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { User, Mail, Phone, Shield, Key, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatFullName } from '@/utils/formatName';

// ═══════════════════════════════════════════════════════════
// SettingsHeader
// ═══════════════════════════════════════════════════════════
const SettingsHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <header className="text-center mb-12">
        <h1 className="text-3xl font-serif text-rosewood">{title}</h1>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{subtitle}</p>
    </header>
);

// ═══════════════════════════════════════════════════════════
// SettingsSection
// ═══════════════════════════════════════════════════════════
const SettingsSection: React.FC<{ section: any; index: number; onAction: (label: string) => void; isTamil: boolean; t: (key: string, params?: any) => string }> = ({ section, index, onAction, isTamil, t }) => (
    <motion.section
        key={section.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 * index }}
        className="bg-white border border-gold-soft/10 rounded-xl p-8 shadow-md group"
    >
        <div className="flex items-center gap-5 mb-8">
            <div className="w-12 h-12 bg-ivory rounded-xl flex items-center justify-center text-rosewood group-hover:bg-rosewood group-hover:text-white transition-all shadow-sm">{section.icon}</div>
            <div>
                <h4 className="text-xl font-serif font-black text-rosewood">{section.title}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{section.description}</p>
            </div>
        </div>
        {section.fields && (
            <div className="grid grid-cols-1 gap-4">
                {section.fields.map((field: any) => (
                    <div key={field.key} className="p-5 bg-gray-50/50 rounded-xl border border-transparent hover:border-gold-soft/20 hover:bg-white transition-all group/field">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-ivory text-gold flex items-center justify-center shadow-sm">{field.icon}</div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</p>
                                    <p className="text-rosewood font-black mt-0.5 tracking-tight">{field.value}</p>
                                </div>
                            </div>
                            {field.verified && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg border border-green-100">
                                    <Check size={12} strokeWidth={4} />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{t('common.verified')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
        {section.actions && (
            <div className="grid grid-cols-1 gap-4">
                {section.actions.map((action: any) => (
                    <button key={action.label} onClick={() => onAction(action.label)} className="w-full flex items-center justify-between p-5 bg-gray-50/50 rounded-xl border border-transparent hover:border-gold-soft/20 hover:bg-white transition-all group/action">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-ivory text-gold flex items-center justify-center shadow-sm">{action.icon}</div>
                            <span className="text-sm font-black text-rosewood">{action.label}</span>
                        </div>
                        <ArrowRight size={16} className="text-gold/40 group-hover/action:translate-x-1 transition-transform" />
                    </button>
                ))}
            </div>
        )}
    </motion.section>
);

// ═══════════════════════════════════════════════════════════
// SecurityShield
// ═══════════════════════════════════════════════════════════
const SecurityShield: React.FC<{ t: (key: string, params?: any) => string }> = ({ t }) => (
    <div className="text-center pt-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{t('adminMatrimony.settings.securityShieldActive')}</p>
        <div className="flex justify-center gap-4 mt-4">
            <div className="w-1 h-1 rounded-full bg-gold/30" />
            <div className="w-1 h-1 rounded-full bg-gold/30" />
            <div className="w-1 h-1 rounded-full bg-gold/30" />
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// AdminSettings (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const AdminSettings: React.FC = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';

    const accountSections = [
        {
            id: 'profile',
            title: t('adminMatrimony.settings.identityTitle'),
            description: t('adminMatrimony.settings.identityDesc'),
            icon: <User className="w-5 h-5" />,
            fields: [
                { label: t('adminMatrimony.settings.adminName'), value: isTamil ? formatFullName(user?.firstNameTa, user?.lastNameTa) : formatFullName(user?.firstNameEn, user?.lastNameEn), key: 'name', icon: <User size={16} /> },
                { label: t('adminMatrimony.settings.secureEmail'), value: user?.email, key: 'email', icon: <Mail size={16} />, verified: true },
                { label: t('adminMatrimony.settings.priorityContact'), value: user?.phone, key: 'phone', icon: <Phone size={16} />, verified: true }
            ]
        },
        {
            id: 'security',
            title: t('adminMatrimony.settings.securityVault'),
            description: t('adminMatrimony.settings.securityDesc'),
            icon: <Shield className="w-5 h-5" />,
            actions: [
                { label: t('adminMatrimony.settings.changePassword'), icon: <Key size={16} />, type: 'button', enabled: false }
            ]
        }
    ];

    const handleAction = (label: string) => {
        toast.info(t('adminMatrimony.settings.featureComingSoon', { label }));
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl mx-auto pb-16 pt-8">
            <SettingsHeader title={t('adminMatrimony.settings.systemSettings')} subtitle={t('adminMatrimony.settings.adminControlCenter')} />
            {accountSections.map((section, sIdx) => (
                <SettingsSection key={section.id} section={section} index={sIdx} onAction={handleAction} isTamil={isTamil} t={t} />
            ))}
            <SecurityShield t={t} />
        </motion.div>
    );
};

export default AdminSettings;
