import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CreditCard, Calendar, Check, Loader2, ShieldCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';
import { stubFetchPremiumPrice } from '@/utils/stubs';

interface PlanUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { plan: string; months: number; amount: number; paymentMode: string }) => void;
    userName: string;
    currentPlan: string;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    userName,
    currentPlan
}) => {
    const { t } = useTranslation(['adminMatrimony', 'common']);
    const [months, setMonths] = useState(1);
    const [amount, setAmount] = useState(0);
    const [premiumPriceData, setPremiumPriceData] = useState(0);
    const [isLoadingPrice, setIsLoadingPrice] = useState(true);
    useEffect(() => { stubFetchPremiumPrice().then(setPremiumPriceData).finally(() => setIsLoadingPrice(false)); }, []);
    const unitPrice = premiumPriceData || 0;
    const [paymentMode, setPaymentMode] = useState('CASH');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            scrollToTop();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (unitPrice > 0) {
            setAmount(unitPrice * months);
        }
    }, [months, unitPrice]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        onConfirm({
            plan: 'PREMIUM',
            months,
            amount,
            paymentMode
        });
    };

    const durationOptions = [
        { label: t('users.upgradeModal.durations.oneMonth'), value: 1 },
        { label: t('users.upgradeModal.durations.threeMonths'), value: 3 },
        { label: t('users.upgradeModal.durations.sixMonths'), value: 6 },
        { label: t('users.upgradeModal.durations.twelveMonths'), value: 12 },
    ];

    const paymentModes = [
        { label: t('users.upgradeModal.paymentModes.cash'), value: 'CASH' },
        { label: t('users.upgradeModal.paymentModes.upi'), value: 'UPI' },
        { label: t('users.upgradeModal.paymentModes.bank'), value: 'BANK_TRANSFER' },
    ];

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onClose()}
                        className="absolute inset-0 bg-linear-to-br from-ivory/40 via-gold-soft/20 to-ivory/40 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl overflow-hidden pointer-events-none" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
                        <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0">
                                        <TrendingUp size={24} className="text-rosewood" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-rosewood tracking-tight truncate leading-tight">
                                            {t('users.upgradeModal.title')}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-rosewood-gradient text-white rounded-full transition-all hover:brightness-110 hover:rotate-90 duration-300 ml-4 shadow-md"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="p-4 bg-linear-to-br from-ivory via-ivory to-gold-soft/30 rounded-xl border border-gold/20 shadow-sm">
                                        <span className="text-[9px] text-rosewood/40 font-black uppercase tracking-widest block mb-1">
                                            {t('users.table.user')}
                                        </span>
                                        <h4 className="text-lg font-black text-rosewood leading-tight mb-2">{userName}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                                            <span className="text-[11px] font-bold text-rosewood/40">
                                                {t('users.currentPlan')}: <span className="font-black">{t(`plans.${currentPlan.toLowerCase()}`)}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Calendar size={14} className="text-gold" />
                                            {t('users.upgradeModal.duration')}
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {durationOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setMonths(opt.value)}
                                                    className={`px-4 py-3.5 rounded-xl text-xs font-black transition-all border-2 ${
                                                        months === opt.value
                                                        ? 'bg-linear-to-br from-gold/30 via-ivory to-gold/30 text-rosewood border-gold/30 shadow-sm'
                                                        : 'bg-linear-to-br from-ivory/80 to-white text-rosewood/60 border-gold/10 hover:border-gold/30'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-linear-to-br from-rosewood to-rosewood/90 rounded-xl border border-white/10 flex items-center justify-between shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 pointer-events-none" />
                                            <div className="relative z-10 flex flex-col">
                                                <span className="text-[9px] font-black text-gold/60 uppercase tracking-widest mb-1">
                                                    {t('users.upgradeModal.confirmedAmount')}
                                                </span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-gold">₹</span>
                                                    <span className="text-2xl font-black text-white tracking-tight">
                                                        {amount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="relative z-10 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gold">
                                                <CreditCard size={20} />
                                            </div>
                                            {isLoadingPrice && (
                                                <div className="absolute inset-0 bg-rosewood/60 backdrop-blur-sm flex items-center justify-center z-20">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gold opacity-80" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest ml-1">
                                            {t('users.upgradeModal.paymentMode')}
                                        </label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {paymentModes.map((mode) => (
                                                <button
                                                    key={mode.value}
                                                    type="button"
                                                    onClick={() => setPaymentMode(mode.value)}
                                                    className={`px-5 py-2.5 rounded-full text-[10px] font-black border-2 transition-all flex items-center gap-2 ${
                                                        paymentMode === mode.value
                                                        ? 'bg-linear-to-br from-gold/30 via-ivory to-gold/30 text-rosewood border-gold/30 shadow-sm'
                                                        : 'bg-linear-to-br from-ivory/80 to-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                                    }`}
                                                >
                                                    {paymentMode === mode.value && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                                                    {mode.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 backdrop-blur-xl border-t border-gold/10 shrink-0">
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 bg-rosewood-gradient border-2 border-gold/20 text-rosewood font-bold rounded-xl hover:shadow-md hover:border-gold/40 transition-all text-sm shadow-sm"
                                    >
                                        {t('common:cancel')}
                                    </button>
                                    <button
                                        onClick={() => handleSubmit()}
                                        disabled={amount <= 0 || isLoadingPrice}
                                        className="flex-1 px-6 py-3 bg-linear-to-br from-gold/30 via-ivory to-gold/30 text-rosewood font-bold rounded-xl hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoadingPrice ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check size={16} strokeWidth={3} />
                                        )}
                                        {t('users.upgradeModal.confirmUpgrade')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
