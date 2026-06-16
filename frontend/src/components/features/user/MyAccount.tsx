import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useBillingOverviewQuery } from '@/queries/useMembershipQueries';
import type { BillingOverview } from '@/api/membership.api';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/format';
import {
    ShieldCheck,
    Trash2,
    CreditCard,
    Calendar,
    Clock,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Lock,
    Eye,
    Printer,
    Star,
    Users
} from 'lucide-react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { toast } from 'sonner';
import { ChangePasswordForm } from '@/components/forms/user/ChangePasswordForm';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { useDateFormatter } from '../../../hooks/useDateFormatter';
import Card from '@/components/ui/shared/Card';
import { ComingSoonOverlay } from '@/components/ui/ComingSoonOverlay';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';
import { formatFullName } from '@/utils/formatName';
import { UserPlanCard } from '@/components/features/user/UserPlanCard';
import MyAccountSkeleton from '@/components/features/user/skeletons/MyAccountSkeleton';


// ═══════════════════════════════════════════════════════════
// Animation Variants (matching PaymentSection reference)
// ═══════════════════════════════════════════════════════════

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.08 },
    },
};

// ═══════════════════════════════════════════════════════════
// Header Tab Bar
// ═══════════════════════════════════════════════════════════

const TabBar: React.FC<{ activeTab: string; onTabChange: (t: any) => void }> = ({ activeTab, onTabChange }) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    return (
        <>
            <button
                onClick={() => onTabChange('details')}
                className={`h-full px-3 md:px-6 flex items-center text-sm md:text-base font-serif font-bold transition-colors relative ${
                    activeTab === 'details'
                        ? 'text-rosewood'
                        : 'text-rosewood/60 hover:text-rosewood'
                }`}
            >
                {t('myaccount:tabs.details')}
                {activeTab === 'details' && (
                    <div className="absolute bottom-0 left-3 md:left-6 right-3 md:right-6 h-0.5 bg-gold rounded-t-full" />
                )}
            </button>
            <button
                onClick={() => onTabChange('membership')}
                className={`h-full px-3 md:px-6 flex items-center text-sm md:text-base font-serif font-bold transition-colors relative ${
                    activeTab === 'membership'
                        ? 'text-rosewood'
                        : 'text-rosewood/60 hover:text-rosewood'
                }`}
            >
                {t('myaccount:tabs.membership')}
                {activeTab === 'membership' && (
                    <div className="absolute bottom-0 left-3 md:left-6 right-3 md:right-6 h-0.5 bg-gold rounded-t-full" />
                )}
            </button>
            <button
                onClick={() => onTabChange('plans')}
                className={`h-full px-3 md:px-6 flex items-center text-sm md:text-base font-serif font-bold transition-colors relative ${
                    activeTab === 'plans'
                        ? 'text-rosewood'
                        : 'text-rosewood/60 hover:text-rosewood'
                }`}
            >
                {t('myaccount:tabs.plans')}
                {activeTab === 'plans' && (
                    <div className="absolute bottom-0 left-3 md:left-6 right-3 md:right-6 h-0.5 bg-gold rounded-t-full" />
                )}
            </button>
        </>
    );
};

// ═══════════════════════════════════════════════════════════
// Info Row (matches reference bank row pattern)
// ═══════════════════════════════════════════════════════════

const InfoRow: React.FC<{
    label: string;
    value?: string;
    verified?: boolean;
    isLoading?: boolean;
}> = ({ label, value, verified, isLoading }) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    return (
        <div className="group p-4 rounded-xl border border-gold/10 hover:border-gold-500/20 hover:bg-ivory transition-all cursor-default">
            <p className="text-[10px] font-bold text-gold-500 mb-1">{label}</p>
            <div className="flex items-center gap-2">
                {isLoading ? (
                    <div className="h-4 w-32 skeleton" />
                ) : (
                    <>
                        <span className="text-sm text-dark-brown font-body">{value || t('myaccount:details.not_specified')}</span>
                        {verified && <BadgeCheck size={14} className="text-emerald-500 shrink-0" />}
                    </>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Transaction Row (reference-inspired interactive style)
// ═══════════════════════════════════════════════════════════

const TransactionRow: React.FC<{
    plan: string;
    amount: number;
    createdAt: string;
    endDate: string;
}> = ({ plan, amount, createdAt, endDate }) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    const isActive = new Date(endDate) > new Date();

    return (
        <div className="group p-4 md:p-5 rounded-xl border border-gold/10 hover:border-gold-500/20 hover:bg-ivory transition-all cursor-default">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-rosewood">
                        {t('myaccount:membership.history.plan_label', { plan })}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-red-50 text-red-500 border border-red-200'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                        {isActive ? t('myaccount:membership.history.active') : t('myaccount:membership.history.expired')}
                    </span>
                </div>
                <span className="text-sm font-black text-rosewood">{formatCurrency(amount)}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1.5">
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {t('myaccount:membership.history.purchased')}: {format(new Date(createdAt), 'MMM dd, yyyy')}
                </p>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {isActive ? t('myaccount:membership.history.expires') : t('myaccount:membership.history.expired')} {format(new Date(endDate), 'MMM dd, yyyy')}
                </p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Our Plans Section
// ═══════════════════════════════════════════════════════════

const OurPlansSection: React.FC<{ plans: any[]; isTamil: boolean; currentPlanCode?: string | null; onUpgradeClick?: () => void }> = ({ plans, isTamil, currentPlanCode, onUpgradeClick }) => {
    const { t } = useLanguage();

    const handleUpgrade = (plan: any) => {
        if (plan.code === currentPlanCode) return;
        onUpgradeClick?.();
    };

    return (
        <div className="w-full space-y-8 pt-4 max-w-7xl mx-auto">
            <SectionHeader
                title={t('myaccount:membership.plans_title')}
                description={t('myaccount:membership.plans_desc')}
            />

            {plans.length === 0 ? (
                <div className="rounded-xl border border-gold/20 bg-ivory shadow-sm p-12 text-center">
                    <p className="text-slate-500 text-sm">{isTamil ? 'திட்டங்கள் எதுவும் இல்லை' : 'No plans available'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <UserPlanCard
                            key={plan.id}
                            plan={plan}
                            currentPlanCode={currentPlanCode ?? undefined}
                            onUpgrade={handleUpgrade}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Payment Card (moved from Dashboard)
// ═══════════════════════════════════════════════════════════

const PaymentCard: React.FC<{ icon: string; title: string; showOverlay?: boolean; children: React.ReactNode }> = ({ icon, title, children, showOverlay }) => (
    <Card className="p-8 flex flex-col relative">
        {showOverlay && <ComingSoonOverlay />}
        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <h4 className="font-heading font-bold text-rosewood text-xl leading-tight">
                {title}
            </h4>
        </div>
        {children}
    </Card>
);

// ═══════════════════════════════════════════════════════════
// Contact Banner (moved from Dashboard)
// ═══════════════════════════════════════════════════════════

const ContactBanner: React.FC = () => {
    const { t } = useLanguage();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success(t('common:copied'), { duration: 2000 });
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedField(field);
            toast.success(t('common:copied'), { duration: 2000 });
            setTimeout(() => setCopiedField(null), 2000);
        }
    };

    return (
        <Card
            variant="ivory"
            className="mt-12 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden bg-linear-to-br from-white via-ivory to-white shadow-lg shadow-gold/5 border border-gold/10"
        >
            <div className="absolute inset-0 bg-kolam-pattern opacity-[0.03] scale-125 pointer-events-none" />
            <div className="absolute right-0 top-0 w-1/3 h-full bg-linear-to-l from-gold/10 to-transparent pointer-events-none" />

            <div className="relative z-10 text-center lg:text-left">
                <h3 className="text-lg md:text-xl font-heading font-bold text-rosewood mb-2">{t('dashboard:contact_for_payment_title')}</h3>
                <p className="text-xs md:text-sm text-rosewood/50 font-body leading-relaxed max-w-xs mx-auto lg:mx-0">
                    {t('dashboard:contact_for_payment_desc')}
                </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 md:gap-8">
                <div
                    onClick={() => handleCopy('+91 90807 25466', 'Phone')}
                    className="group cursor-pointer flex flex-col items-center sm:items-end"
                >
                    <p className="text-micro md:text-tiny font-bold text-gold uppercase tracking-widest mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {t('dashboard:payment_support_label')}
                    </p>
                    <div className="flex items-center gap-2 text-rosewood group-hover:text-gold transition-colors whitespace-nowrap">
                        <span className="text-lg md:text-xl font-medium font-body tracking-tighter">
                            +91 90807 25466
                        </span>
                        <span className="material-symbols-outlined text-base md:text-lg opacity-40 group-hover:opacity-100 transition-opacity">
                            {copiedField === 'Phone' ? 'check' : 'content_copy'}
                        </span>
                    </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-gold/20" />

                <div className="flex items-center gap-4">
                    <a
                        href="tel:+919080725466"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-rosewood/10 hover:bg-rosewood/20 text-rosewood flex items-center justify-center transition-all border border-gold/10 shadow-lg group"
                    >
                        <span className="material-symbols-outlined text-xl md:text-2xl group-hover:scale-110 transition-transform">
                            call
                        </span>
                    </a>
                    <a
                        href="https://wa.me/919080725466"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gold hover:bg-gold/80 text-rosewood flex items-center justify-center transition-all shadow-lg group"
                        title="WhatsApp"
                    >
                        <WhatsAppIcon sx={{ fontSize: 24 }} />
                    </a>
                </div>
            </div>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════
// Payment Section (moved from Dashboard)
// ═══════════════════════════════════════════════════════════

const paymentContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

const paymentItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const PaymentSection: React.FC = () => {
    const { t, language } = useLanguage();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success(t('common:copied'), { duration: 2000 });
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedField(field);
            toast.success(t('common:copied'), { duration: 2000 });
            setTimeout(() => setCopiedField(null), 2000);
        }
    };

    const bankDetails = [
        { id: 'bankName', label: t('dashboard:bank_name'), value: 'State Bank of India' },
        { id: 'accHolder', label: t('dashboard:account_holder'), value: 'Mohanur Kongu Manamaalai' },
        { id: 'accNo', label: t('dashboard:account_no'), value: '1234567890' },
        { id: 'ifsc', label: 'IFSC', value: 'SBIN0001234' },
        { id: 'branch', label: t('dashboard:branch'), value: 'Mohanur' },
    ];

    return (
        <section className="mt-16 mb-10 relative px-0 overflow-hidden">
            <motion.div
                className="max-w-7xl mx-auto relative z-10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={paymentContainerVariants}
            >
                <motion.div variants={paymentItemVariants}>
                    <SectionHeader
                        title={t('dashboard:payment_info_title')}
                        description={t('dashboard:payment_info_desc')}
                    />
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={paymentContainerVariants}
                >
                    <PaymentCard
                        icon="account_balance"
                        title={t('dashboard:bank_transfer')}
                        showOverlay
                    >
                        <div className="space-y-4">
                            {bankDetails.map((item) => (
                                <div
                                    key={item.id}
                                    className="group cursor-pointer p-4 rounded-xl border border-transparent hover:border-gold-500/20 hover:bg-ivory transition-all"
                                    onClick={() => handleCopy(item.value, item.label)}
                                >
                                    <p className="text-tiny font-bold text-gold-500 uppercase tracking-widest mb-1">
                                        {item.label}
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-dark-brown font-body">{item.value}</p>
                                        <span className="material-symbols-outlined text-sm text-gold-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                            {copiedField === item.id ? 'check' : 'content_copy'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PaymentCard>

                    <PaymentCard
                        icon="qr_code_2"
                        title={t('dashboard:gpay_phonepe')}
                        showOverlay
                    >
                        <div className="space-y-8 flex-1">
                            <div className="bg-ivory rounded-2xl border border-gold-500/10 p-8 flex flex-col items-center justify-center space-y-3">
                                <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center shadow-inner">
                                    <span className="material-symbols-outlined text-[5rem] text-gold-500/20 font-light">
                                        qr_code_2
                                    </span>
                                </div>
                                <p className="text-tiny font-bold text-gold-500 uppercase tracking-widest">
                                    {t('dashboard:qr_placeholder')}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div
                                    className="group cursor-pointer p-4 rounded-xl border border-gold-500/10 hover:border-gold-500/30 transition-all"
                                    onClick={() => handleCopy('mohanurkongu@okhdfcbank', 'upi')}
                                >
                                    <p className="text-tiny font-bold text-gold-500 uppercase tracking-widest mb-1">
                                        UPI ID
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-dark-brown font-body">mohanurkongu@okhdfcbank</p>
                                        <span className="material-symbols-outlined text-sm text-gold-500">
                                            {copiedField === 'upi' ? 'check' : 'content_copy'}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="group cursor-pointer p-4 rounded-xl border border-gold-500/10 hover:border-gold-500/30 transition-all"
                                    onClick={() => handleCopy('919080725466', 'phone')}
                                >
                                    <p className="text-tiny font-bold text-gold-500 uppercase tracking-widest mb-1">
                                        {t('dashboard:contact_phone')}
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-dark-brown font-body">+91 90807 25466</p>
                                        <span className="material-symbols-outlined text-sm text-gold-500">
                                            {copiedField === 'phone' ? 'check' : 'content_copy'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PaymentCard>

                    <PaymentCard
                        icon="location_on"
                        title={t('dashboard:visit_address')}
                    >
                        <div className="space-y-8 flex-1">
                            <div className="p-6 rounded-2xl bg-ivory border border-gold-500/10">
                                <p className="text-tiny font-bold text-gold-500 uppercase tracking-widest mb-4">
                                    {t('dashboard:office_address_label')}
                                </p>
                                <p className="text-sm text-dark-brown font-body leading-[20px] whitespace-pre-line">
                                    Kongu Velala Goundarkal Samudhaya Nala Arakkattalai,\n4 / 22 A, Namakkal Main Road, Thoppur,\nMohanur, Namakkal - 637015.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500">
                                        <span className="material-symbols-outlined text-base">schedule</span>
                                    </div>
                                    <div>
                                        <p className="text-tiny font-bold text-gold-500 uppercase tracking-widest mb-0.5">
                                            {t('dashboard:office_hours')}
                                        </p>
                                        <p className="text-sm text-dark-brown font-body">10 AM - 6 PM</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500">
                                        <span className="material-symbols-outlined text-base">calendar_month</span>
                                    </div>
                                    <div>
                                        <p className="text-tiny font-bold text-gold-500 uppercase tracking-widest mb-0.5">
                                            {t('dashboard:days')}
                                        </p>
                                        <p className="text-sm text-dark-brown font-body">
                                            {language === 'ta' ? 'திங்கள் - சனி (ஞாயிறு விடுமுறை)' : 'Mon - Sat (Sun Holiday)'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PaymentCard>
                </motion.div>

                <motion.div variants={paymentItemVariants}>
                    <ContactBanner />
                </motion.div>
            </motion.div>
        </section>
    );
};

// ═══════════════════════════════════════════════════════════
// Personal Information Section
// ═══════════════════════════════════════════════════════════

const PersonalInfoSection: React.FC<{ user: any; isLoading: boolean }> = ({ user, isLoading }) => {
    const { t, language } = useLanguage();

    return (
        <AnimatedSection>
            <SectionHeader
                title={t('myaccount:details.title')}
                description={t('myaccount:details.description')}
            />
            <div className="rounded-xl border border-gold/20 bg-ivory shadow-sm p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow 
                        label={t('myaccount:details.fields.name_en')} 
                        value={formatFullName(user?.firstNameEn, user?.lastNameEn)} 
                        isLoading={isLoading}
                    />
                    <InfoRow 
                        label={t('myaccount:details.fields.name_ta')} 
                        value={formatFullName(user?.firstNameTa, user?.lastNameTa)} 
                        isLoading={isLoading}
                    />
                    <InfoRow 
                        label={t('myaccount:details.fields.email')} 
                        value={user?.email} 
                        verified 
                        isLoading={isLoading}
                    />
                    <InfoRow 
                        label={t('myaccount:details.fields.phone')} 
                        value={user?.phone} 
                        verified 
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </AnimatedSection>
    );
};

// ═══════════════════════════════════════════════════════════
// Security Section
// ═══════════════════════════════════════════════════════════

const SecuritySection: React.FC<{ onChangePassword: () => void }> = ({ onChangePassword }) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';

    return (
        <AnimatedSection>
            <SectionHeader
                title={t('myaccount:details.security_title')}
                description={t('myaccount:details.security_desc')}
            />
            <div className="rounded-xl border border-gold/20 bg-ivory shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 shrink-0">
                            <Lock size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-rosewood">{t('myaccount:details.update_password')}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{t('myaccount:details.update_password_desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onChangePassword}
                        className="shrink-0 px-6 py-3 bg-ivory-premium rounded-xl font-bold text-xs shadow-lg shadow-gold/20 hover:shadow-gold/30 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                        {t('myaccount:details.change_password')}
                    </button>
                </div>
                <div className="mt-6 pt-6 border-t border-gold/10 flex items-start gap-3">
                    <ShieldCheck size={14} className="text-gold-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        {t('myaccount:details.security_notice')}
                    </p>
                </div>
            </div>
        </AnimatedSection>
    );
};

// ═══════════════════════════════════════════════════════════
// Danger Zone Section (self-contained state)
// ═══════════════════════════════════════════════════════════

const DangerZoneSection: React.FC = () => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    const [isDeactivateConfirm, setIsDeactivateConfirm] = useState(false);

    const handleDeactivate = () => {
        toast.error(t('myaccount:details.deactivate.restricted'));
        setIsDeactivateConfirm(false);
    };

    return (
        <AnimatedSection>
            <SectionHeader
                title={t('myaccount:details.danger_title')}
                description={t('myaccount:details.danger_desc')}
            />
            <div className="rounded-xl border border-rosewood/20 bg-ivory shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-14 h-14 rounded-xl bg-rosewood/5 text-rosewood flex items-center justify-center shrink-0">
                        <Trash2 size={28} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-base font-bold text-rosewood mb-1">{t('myaccount:details.deactivate.title')}</h4>
                        <p className="text-xs text-rosewood/60 leading-relaxed max-w-lg">
                            {t('myaccount:details.deactivate.description')}
                        </p>
                        {!isDeactivateConfirm ? (
                                <button
                                    onClick={() => setIsDeactivateConfirm(true)}
                                    className="mt-5 px-6 py-3 bg-rosewood-premium rounded-xl font-bold text-xs shadow-md shadow-rosewood/20 hover:shadow-rosewood/30 hover:-translate-y-0.5 transition-all active:scale-95"
                                >
                                    {t('myaccount:details.deactivate.button')}
                                </button>
                        ) : (
                            <div className="mt-5 flex flex-col sm:flex-row items-center gap-4">
                                <span className="text-xs font-bold text-rosewood">{t('myaccount:details.deactivate.confirm')}</span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsDeactivateConfirm(false)}
                                        className="px-5 py-2.5 bg-ivory-premium rounded-xl font-bold text-xs hover:shadow-gold/20 transition-all"
                                    >
                                        {t('myaccount:details.deactivate.cancel')}
                                    </button>
                                    <button
                                        onClick={handleDeactivate}
                                        className="px-5 py-2.5 bg-rosewood-premium rounded-xl font-bold text-xs shadow-sm shadow-rosewood/20 hover:shadow-rosewood/30 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        {t('myaccount:details.deactivate.confirm_yes')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
};

// ═══════════════════════════════════════════════════════════
// Membership Status Section
// ═══════════════════════════════════════════════════════════

const MembershipStatusSection: React.FC<{
    currentPlan: BillingOverview['currentPlan'];
    capabilities: BillingOverview['capabilities'];
    isLoading: boolean;
}> = ({ currentPlan, capabilities, isLoading }) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';

    const planName = currentPlan?.name || '—';
    const expiresAt = currentPlan?.expiresAt || null;

    return (
        <AnimatedSection>
            <SectionHeader
                title={t('myaccount:membership.title')}
                description={t('myaccount:membership.description')}
            />
            <div className="rounded-xl border border-gold/20 bg-ivory shadow-sm p-6 md:p-8">
                <div className="mb-5">
                    <p className="text-[10px] font-bold text-gold-500 mb-1">{t('myaccount:membership.plan_field')}</p>
                    {isLoading ? (
                        <div className="h-8 w-40 skeleton mt-1" />
                    ) : (
                        <h3 className="text-2xl font-serif font-black text-gold tracking-tight">
                            {planName}
                        </h3>
                    )}
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-linear-to-br from-ivory to-white border border-gold/20 shadow-lg shadow-gold/10 ring-1 ring-gold/20 gap-3 mb-5">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-gold/10 rounded-xl shrink-0">
                            <Calendar size={18} className="text-gold" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] sm:text-[9px] font-black text-rosewood/30 mb-0.5">
                                {t('myaccount:membership.valid_until')}
                            </span>
                            {isLoading ? (
                                <div className="h-4 w-32 skeleton mt-0.5" />
                            ) : (
                                <span className="text-xs sm:text-sm font-black text-rosewood leading-tight">
                                    {expiresAt
                                        ? format(new Date(expiresAt), 'MMM dd, yyyy')
                                        : (currentPlan?.planCode === 'BRONZE' && !expiresAt
                                            ? (isTamil ? 'காலவரையின்றி' : 'Lifetime')
                                            : t('myaccount:membership.not_available'))}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="mt-6">
                        <div className="flex-1 h-11 skeleton rounded-xl!" />
                    </div>
                )}
            </div>
        </AnimatedSection>
    );
};

// ═══════════════════════════════════════════════════════════
// Usage Limits Section
// ═══════════════════════════════════════════════════════════

const UsageLimitsSection: React.FC<{
    capabilities: BillingOverview['capabilities'];
    isLoading: boolean;
}> = ({ capabilities, isLoading }) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';

    return (
        <AnimatedSection>
            <SectionHeader
                title={isTamil ? 'பயன்பாட்டு வரம்புகள்' : 'Usage Limits'}
                description={isTamil ? 'உங்கள் திட்டத்தின் பயன்பாட்டு விளக்கங்கள்' : 'Your plan usage breakdown'}
            />
            <div className="rounded-xl border border-gold/20 bg-ivory shadow-sm p-6 md:p-8">
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[1,2,3,4,5].map(i => <div key={i} className="h-16 skeleton rounded-lg!" />)}
                    </div>
                ) : capabilities ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <CapabilityBadge
                            icon={<Eye size={14} />}
                            label={isTamil ? 'தேடல்' : 'Search'}
                            value={capabilities.searchLevel || '—'}
                        />
                        <UsageBar
                            icon={<Users size={14} />}
                            label={isTamil ? 'சுயவிவரங்கள்' : 'Profiles'}
                            current={capabilities.profileCount ?? 0}
                            limit={capabilities.profileSlotLimit}
                        />
                        <UsageBar
                            icon={<Star size={14} />}
                            label={isTamil ? 'குறும்பட்டியல்' : 'Shortlists'}
                            current={capabilities.shortlistCount ?? 0}
                            limit={capabilities.shortlistLimit}
                        />
                        <UsageBar
                            icon={<Eye size={14} />}
                            label={isTamil ? 'தினசரி காட்சிகள்' : 'Daily Views'}
                            current={Math.max(0, (capabilities.openLimit ?? 0) - (capabilities.openRemaining ?? 0))}
                            limit={capabilities.openLimit}
                        />
                        <CapabilityBadge
                            icon={<Printer size={14} />}
                            label={isTamil ? 'அச்சு' : 'Print'}
                            value={capabilities.printProfile ? (isTamil ? 'ஆம்' : 'Yes') : (isTamil ? 'இல்லை' : 'No')}
                        />
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-rosewood/40 text-sm">{isTamil ? 'தரவு இல்லை' : 'No data available'}</p>
                    </div>
                )}
            </div>
        </AnimatedSection>
    );
};

const CapabilityBadge: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ivory border border-gold/10">
        <div className="text-gold shrink-0">{icon}</div>
        <div className="min-w-0">
            <p className="text-[9px] font-bold text-rosewood/40 uppercase tracking-wider">{label}</p>
            <p className="text-[11px] font-bold text-rosewood truncate">{value}</p>
        </div>
    </div>
);

const UsageBar: React.FC<{ icon: React.ReactNode; label: string; current: number; limit: number }> = ({ icon, label, current, limit }) => {
    const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
    const barColor = pct >= 90 ? 'bg-red-100' : pct >= 70 ? 'bg-amber-100' : 'bg-emerald-100';
    return (
        <div className="p-2.5 rounded-lg bg-ivory border border-gold/10">
            <div className="flex items-center gap-2 mb-1.5">
                <div className="text-gold shrink-0">{icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-rosewood/40 uppercase tracking-wider">{label}</p>
                    <p className="text-[11px] font-bold text-rosewood truncate">{current}/{limit === -1 ? '∞' : limit}{limit >= 0 && limit > 0 ? ` (${pct}%)` : ''}</p>
                </div>
            </div>
            {limit > 0 && (
                <div className={`h-1.5 rounded-full ${barColor} overflow-hidden`}>
                    <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Purchase History Section (self-contained query + state)
// ═══════════════════════════════════════════════════════════

const PurchaseHistorySection: React.FC<{
    history: BillingOverview['history'];
    isLoading: boolean;
    hasError: boolean;
}> = ({ history, isLoading, hasError }) => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    const [showAllHistory, setShowAllHistory] = useState(false);

    const displayedHistory = showAllHistory ? history : history?.slice(0, 3);

    return (
        <AnimatedSection>
            <SectionHeader
                title={t('myaccount:membership.history.title')}
                description={t('myaccount:membership.history.subtitle')}
            />

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-5 rounded-xl border border-gold/10 bg-ivory">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-32 skeleton" />
                                    <div className="h-5 w-16 skeleton rounded-full!" />
                                </div>
                                <div className="h-4 w-20 skeleton" />
                            </div>
                            <div className="flex gap-4">
                                <div className="h-3 w-36 skeleton rounded-full!" />
                                <div className="h-3 w-36 skeleton rounded-full!" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : hasError ? (
                <div className="rounded-xl border border-gold/20 bg-ivory shadow-sm p-12 text-center">
                    <p className="text-red-500 font-medium">{t('myaccount:membership.history.error')}</p>
                </div>
            ) : !history || history.length === 0 ? (
                <div className="rounded-xl border border-gold/20 bg-ivory shadow-sm p-12 text-center">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-4 border border-gold/10">
                        <CreditCard size={28} />
                    </div>
                    <h4 className="text-base font-bold text-slate-600">{t('myaccount:membership.history.empty_title')}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        {t('myaccount:membership.history.empty_desc')}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedHistory?.map((tx: any, idx: number) => (
                        <TransactionRow
                            key={idx}
                            plan={tx.planName}
                            amount={tx.amount}
                            createdAt={tx.startedAt}
                            endDate={tx.expiresAt}
                        />
                    ))}
                    {(history?.length ?? 0) > 3 && (
                        <button
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="w-full py-3 rounded-xl border border-gold/20 bg-white text-rosewood font-bold text-xs flex items-center justify-center gap-2 hover:bg-rosewood/5 transition-all"
                        >
                            {showAllHistory ? (
                                <>{t('myaccount:membership.history.show_less')} <ChevronUp size={14} /></>
                            ) : (
                                <>{t('myaccount:membership.history.show_all', { count: history?.length })} <ChevronDown size={14} /></>
                            )}
                        </button>
                    )}
                </div>
            )}
        </AnimatedSection>
    );
};


// ═══════════════════════════════════════════════════════════
// Main Orchestrator
// ═══════════════════════════════════════════════════════════

const MyAccount: React.FC = () => {
    const { user } = useAuth();
    const { setHeaderContent } = useOutletContext<any>();
    const [searchParams] = useSearchParams();
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    const [activeTab, setActiveTab] = useState<'details' | 'membership' | 'plans'>('details');
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [billing, setBilling] = useState<BillingOverview | null>(null);
    const paymentRef = useRef<HTMLDivElement>(null);

    const scrollToPayment = useCallback(() => {
        paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);
    const [billingLoading, setBillingLoading] = useState(true);
    const [billingError, setBillingError] = useState(false);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'membership') {
            setActiveTab('membership');
        } else if (tabParam === 'plans') {
            setActiveTab('plans');
        }
    }, [searchParams]);

    useEffect(() => {
        setHeaderContent(<TabBar activeTab={activeTab} onTabChange={setActiveTab} />);
        scrollToTop();
        return () => setHeaderContent(null);
    }, [activeTab, setHeaderContent]);

    const billingQuery = useBillingOverviewQuery();
    useEffect(() => {
        if (activeTab !== 'membership' && activeTab !== 'plans') return;
        if (billingQuery.data !== undefined) {
            setBilling(billingQuery.data as BillingOverview);
            setBillingLoading(false);
            setBillingError(false);
        } else if (billingQuery.error) {
            setBillingLoading(false);
            setBillingError(true);
        }
    }, [activeTab, billingQuery.data, billingQuery.error]);

    const isInitiallyLoading = billingQuery.isPending && !billingQuery.data;

    if (isInitiallyLoading && activeTab !== 'details') {
        return <MyAccountSkeleton />;
    }

    return (
        <div className="flex flex-col min-h-full">
            <div className="flex-1 p-6 lg:p-12">
                <div className="max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'details' && (
                            <motion.div
                                key="details"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-16"
                            >
                                <PersonalInfoSection user={user} isLoading={!user} />
                                <SecuritySection onChangePassword={() => setIsChangePasswordOpen(true)} />
                                <DangerZoneSection />
                            </motion.div>
                        )}

                        {activeTab === 'membership' && (
                            <motion.div
                                key="membership"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-16"
                            >
                                <MembershipStatusSection
                                    currentPlan={billing?.currentPlan ?? null}
                                    capabilities={billing?.capabilities ?? null}
                                    isLoading={billingLoading}
                                />
                                <UsageLimitsSection
                                    capabilities={billing?.capabilities ?? null}
                                    isLoading={billingLoading}
                                />
                                <PurchaseHistorySection
                                    history={billing?.history ?? []}
                                    isLoading={billingLoading}
                                    hasError={billingError}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'plans' && (
                            <motion.div
                                key="plans"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-16"
                            >
                                <OurPlansSection plans={billing?.plans ?? []} isTamil={isTamil} currentPlanCode={billing?.currentPlan?.planCode} onUpgradeClick={scrollToPayment} />
                                <div ref={paymentRef}>
                                    <PaymentSection />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {isChangePasswordOpen && (
                    <ChangePasswordForm isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyAccount;
