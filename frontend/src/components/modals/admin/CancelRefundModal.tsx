import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, XCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/forms/Input';
import type { MandapamBooking } from '@/services/mandapamService';
import { useLanguage } from '@/context/LanguageContext';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface CancelRefundModalProps {
    isOpen: boolean;
    booking: MandapamBooking | null;
    onClose: () => void;
    t: any;
    onConfirm: (booking: MandapamBooking, refundType: string, refundAmount: string) => void;
}

export const CancelRefundModal: React.FC<CancelRefundModalProps> = ({ isOpen, booking, onClose, t, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [refundType, setRefundType] = useState<'not_refunded' | 'partial' | 'advance' | 'full'>('not_refunded');
    const [refundAmount, setRefundAmount] = useState('');

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
                                        <XCircle size={24} className="text-rose-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-rosewood tracking-tight truncate leading-tight">
                                            {t('adminMandapam.bookings.cancelBookingTitle') || 'Cancel Booking'}
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
                                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-600/10">
                                        <p className="text-[10px] font-black text-rose-800/40 uppercase tracking-[0.15em] mb-1">{t('adminMandapam.bookings.eventName') || 'Event Name'}</p>
                                        <p className="text-base font-black text-rosewood tracking-tight">{booking.eventTitleEn}</p>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-rose-600/5">
                                            <p className="text-xs font-bold text-rosewood/60">{booking.contactNameEn}</p>
                                            <p className="text-xs font-black text-rose-700">Paid: ₹{booking.paidAmount?.toLocaleString() || '0'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                                        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            {t('adminMandapam.bookings.cancelBookingWarning') || 'Are you sure you want to cancel this booking? This action cannot be undone and will release the slot.'}
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.refundStatus') || 'Refund Disposition'}</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'not_refunded', label: t('adminMandapam.bookings.notRefunded') || 'No Refund' },
                                                { id: 'partial', label: t('adminMandapam.bookings.partialRefund') || 'Partial Refund' },
                                                { id: 'advance', label: t('adminMandapam.bookings.advance') || 'Full Advance' },
                                                { id: 'full', label: t('adminMandapam.bookings.fullRefund') || 'Whole Amount' }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setRefundType(type.id as any)}
                                                    className={`px-3 py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                                        refundType === type.id
                                                        ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                                        : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                                    }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="min-h-[120px]">
                                        <AnimatePresence mode="wait">
                                            {refundType === 'partial' && (
                                                <motion.div
                                                    key="partial"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-3"
                                                >
                                                    <Input
                                                        label={t('adminMandapam.bookings.refundAmount') || 'Refund Amount'}
                                                        name="refundAmount"
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={refundAmount}
                                                        onChange={(e) => setRefundAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        icon="currency_rupee"
                                                        autoFormat={true}
                                                    />
                                                    {refundAmount && Number(refundAmount.replace(/,/g, '')) > 0 && (
                                                        <div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl">
                                                            <span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5 uppercase">
                                                                {t('adminMandapam.bookings.confirmedRefundAmount') || 'CONFIRMED REFUND AMOUNT'}
                                                            </span>
                                                            <span className="text-base font-black text-rosewood">
                                                                ₹ {Number(refundAmount.replace(/,/g, '')).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
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
                                        onClick={() => onConfirm(booking, refundType, refundAmount)}
                                        className="flex-1 px-6 py-3 bg-rose-700 text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-rose-700/20 active:scale-95"
                                    >
                                        {t('adminMandapam.bookings.confirmCancel') || 'Confirm Cancellation'}
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
