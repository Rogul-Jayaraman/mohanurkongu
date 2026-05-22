import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle2, X } from 'lucide-react';
import { Input } from '@/components/ui/forms/Input';
import type { MandapamBooking } from '@/services/mandapamService';
import { useLanguage } from '@/context/LanguageContext';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface ModifyPaymentModalProps {
    isOpen: boolean;
    booking: MandapamBooking | null;
    onClose: () => void;
    t: any;
    onConfirm: (booking: MandapamBooking, paymentType: string, amount: string) => void;
}

export const ModifyPaymentModal: React.FC<ModifyPaymentModalProps> = ({ isOpen, booking, onClose, t, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [paymentType, setPaymentType] = useState<'advance' | 'paid'>('advance');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (booking) {
            setAmount('');
            setPaymentType(booking.paymentStatus === 'FULLY_PAID' ? 'paid' : 'advance');
        }
    }, [booking]);

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

    if (!booking) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onClose()}
                        className="absolute inset-0 bg-gold-soft/10 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-gold-soft/5 backdrop-blur-3xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
                    >
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0">
                                        <CreditCard size={24} className="text-rosewood" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-rosewood tracking-tight truncate leading-tight">
                                            {t('adminMandapam.bookings.updatePayment') || 'Update Payment'}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-ivory rounded-full transition-all text-rosewood/40 hover:text-rosewood hover:rotate-90 duration-300 ml-4"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="bg-gold/5 p-4 rounded-xl border border-gold/10">
                                        <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-[0.15em] mb-1">{t('adminMandapam.bookings.eventName') || 'Event Name'}</p>
                                        <p className="text-base font-black text-rosewood tracking-tight">{booking.eventTitleEn}</p>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gold/5">
                                            <p className="text-xs font-bold text-rosewood/60">{booking.contactNameEn}</p>
                                            <p className="text-xs font-black text-rosewood">Total: ₹{booking.packageSnapshotPrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.paymentStatus') || 'Payment Action'}</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentType('advance')}
                                                className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                                    paymentType === 'advance'
                                                    ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                                }`}
                                            >
                                                {t('adminMandapam.bookings.advance') || 'Add Payment'}
                                            </button>
                                            <button
                                                onClick={() => setPaymentType('paid')}
                                                className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                    paymentType === 'paid'
                                                    ? 'bg-gold text-rosewood border-gold shadow-md'
                                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                                }`}
                                            >
                                                {paymentType === 'paid' && <CheckCircle2 size={14} />}
                                                {t('adminMandapam.bookings.markAsFullyPaid') || 'Settle Balance'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="min-h-[140px]">
                                        <AnimatePresence mode="wait">
                                            {paymentType === 'advance' ? (
                                                <div key="advance" className="space-y-3">
                                                    <Input
                                                        label={t('adminMandapam.bookings.advanceAmount') || 'Payment Amount'}
                                                        name="amount"
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        icon="currency_rupee"
                                                        autoFormat={true}
                                                    />
                                                    {amount && Number(amount.replace(/,/g, '')) > 0 && (
                                                        <div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500">
                                                            <span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5 uppercase">
                                                                {t('adminMandapam.bookings.confirmedPaymentAmount') || 'CONFIRMED PAYMENT AMOUNT'}
                                                            </span>
                                                            <span className="text-base font-black text-rosewood">
                                                                ₹ {Number(amount.replace(/,/g, '')).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div key="paid" className="p-6 bg-rosewood/5 rounded-xl border border-rosewood/10 flex flex-col items-center justify-center text-center space-y-2">
                                                    <CheckCircle2 size={32} className="text-gold" />
                                                    <p className="text-sm font-black text-rosewood">{t('adminMandapam.bookings.markAsFullyPaid') || 'Mark as Fully Paid'}</p>
                                                    <p className="text-[10px] text-rosewood/40 font-bold max-w-[200px]">
                                                        {t('adminMandapam.bookings.fullyPaidDesc') || 'This will update the booking status to fully settled.'}
                                                    </p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-t border-gold/10 shrink-0">
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 border border-gold/10 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm"
                                    >
                                        {t('common.cancel') || 'Cancel'}
                                    </button>
                                    <button
                                        onClick={() => onConfirm(booking, paymentType, amount)}
                                        className="flex-1 px-6 py-3 bg-rosewood text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-rosewood/20 active:scale-95"
                                    >
                                        {t('common.saveChanges') || 'Save Changes'}
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
