import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
    CreditCard,
    Calendar,
    Clock,
    Receipt,
    X
} from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface PlanPurchaseHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PlanTransaction {
    id: string;
    plan: string;
    months: number;
    amount: number;
    paymentMode: string;
    startDate: string;
    endDate: string;
    note?: string;
    createdAt: string;
}

export const PlanPurchaseHistoryDrawer: React.FC<PlanPurchaseHistoryDrawerProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation(['myaccount', 'common']);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['plan-history'],
        queryFn: async () => {
            const res = await api.get('/settings/plan-history');
            return res.data as PlanTransaction[];
        },
        enabled: isOpen,
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            scrollToTop();
        }
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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-end justify-center overflow-hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gold-soft/20 backdrop-blur-sm" />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-4xl max-h-[85vh] bg-gold-soft/10 backdrop-blur-2xl border-t border-gold/20 rounded-t-3xl flex flex-col overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
                    >
                        <div className="w-full flex justify-center pt-3 pb-1 absolute top-0 left-0 z-50 bg-gold-soft/5 backdrop-blur-md">
                            <div className="w-12 h-1.5 rounded-full bg-gray-200" />
                        </div>
                        <div className="pt-10 px-6 pb-6 border-b border-gold/10 flex items-center justify-between sticky top-0 bg-white/40 backdrop-blur-xl z-40">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                    <Receipt size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-black text-rosewood">{t('drawers.purchase_history.title')}</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('drawers.purchase_history.subtitle')}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-rosewood transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-8 pb-12 custom-scrollbar bg-gold-soft/5 backdrop-blur-sm">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-4">
                                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-gray-400 font-medium">{t('drawers.purchase_history.loading')}</p>
                                </div>
                            ) : isError ? (
                                <div className="text-center py-12">
                                    <p className="text-red-500 font-medium">{t('drawers.purchase_history.error')}</p>
                                </div>
                            ) : !data || data.length === 0 ? (
                                <div className="text-center flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                                        <Receipt size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-600">{t('drawers.purchase_history.no_data.title')}</h3>
                                    <p className="text-sm text-gray-400 mt-1 max-w-xs">{t('drawers.purchase_history.no_data.description')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.map((tx) => (
                                        <div key={tx.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-rosewood/5 text-rosewood flex items-center justify-center shrink-0">
                                                        <CreditCard size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-base font-bold text-gray-900">{t('drawers.purchase_history.transaction.plan_name', { plan: tx.plan })}</h4>
                                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-50 text-green-600 border border-green-100">
                                                                {t('drawers.purchase_history.transaction.status_success')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                                                            <Clock size={12} />
                                                            {format(new Date(tx.createdAt), 'MMM dd, yyyy h:mm a')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                                                    <p className="text-lg font-black text-rosewood">₹{tx.amount.toLocaleString('en-IN')}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {t('drawers.purchase_history.transaction.valid_until', { date: format(new Date(tx.endDate), 'MMM dd, yyyy') })}
                                                    </p>
                                                </div>
                                            </div>
                                            {tx.note && (
                                                <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500 italic">
                                                    {t('drawers.purchase_history.transaction.note', { note: tx.note })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
