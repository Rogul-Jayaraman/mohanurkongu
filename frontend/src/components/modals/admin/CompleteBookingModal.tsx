import React, { useState, useEffect } from 'react';
import { CheckCircle2, Info, DollarSign } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, PaymentEntryType, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

type CompletionMode = 'fully_settled' | 'discount';

const FINAL_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / QR' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'CHEQUE', label: 'Cheque' },
];

interface CompleteBookingModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
    onConfirm: (booking: Booking, mode: string, amount: string, paymentMethod: string) => void;
}

export const CompleteBookingModal: React.FC<CompleteBookingModalProps> = ({ isOpen, booking, onClose, t, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [mode, setMode] = useState<CompletionMode>('fully_settled');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');

    useEffect(() => {
        if (booking) {
            setMode('fully_settled');
            setAmount('');
            setPaymentMethod('CASH');
        }
    }, [booking]);

    if (!booking) return null;

    const charges = (booking.ledgerEntries || []).reduce((s, e) => s + e.amount, 0);
    const payments = (booking.paymentEntries || []).reduce((s, e) => s + e.amount, 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + e.amount, 0);
    const outstanding = charges - payments + refunds;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<CheckCircle2 size={24} className="text-emerald-600" />}
            title={t('adminMandapam.bookings.completeBookingTitle') || 'Complete Booking'}
            size="sm"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gold/10 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm"
                    >
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                        onClick={() => onConfirm(booking, mode, amount, paymentMethod)}
                        className="flex-1 px-6 py-3 bg-emerald-700 text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-emerald-700/20 active:scale-95"
                    >
                        {t('adminMandapam.bookings.confirmComplete') || 'Finalize & Complete'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-600/10">
                    <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.15em] mb-1">{t('adminMandapam.bookings.eventName') || 'Event Name'}</p>
                    <p className="text-base font-black text-rosewood tracking-tight">{isTamil ? booking.eventTitle.ta : booking.eventTitle.en}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-600/5">
                        <p className="text-xs font-bold text-rosewood/60">{isTamil ? booking.customerName.ta : booking.customerName.en}</p>
                        <p className="text-xs font-black text-emerald-700">{t('adminMandapam.bookings.outstanding') || 'Due'}: {formatCurrency(outstanding)}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.closeoutStatus') || 'Closeout Status'}</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setMode('fully_settled')}
                            className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                mode === 'fully_settled'
                                ? 'bg-emerald-700 text-ivory border-emerald-700 shadow-md'
                                : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                            }`}
                        >
                            {t('adminMandapam.bookings.fullyPaid') || 'Fully Settled'}
                        </button>
                        <button
                            onClick={() => setMode('discount')}
                            className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                mode === 'discount'
                                ? 'bg-amber-600 text-ivory border-amber-600 shadow-md'
                                : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                            }`}
                        >
                            {t('adminMandapam.bookings.discounted') || 'Apply Discount'}
                        </button>
                    </div>
                </div>

                {mode === 'discount' ? (
                    <div className="space-y-3">
                        <Input
                            label={t('adminMandapam.bookings.finalPayment') || 'Final Amount to Collect'}
                            name="amount"
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={String(Math.max(0, outstanding))}
                            icon="currency_rupee"
                            autoFormat={true}
                        />
                        {amount && Number(amount.replace(/,/g, '')) > 0 && (
                            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <span className="text-[10px] font-black text-amber-800/40 tracking-wider block mb-0.5 uppercase">
                                    {t('adminMandapam.bookings.finalAmount') || 'FINAL COLLECTION'}
                                </span>
                                <span className="text-base font-black text-amber-900">
                                    {formatCurrency(Number(amount.replace(/,/g, '')))}
                                </span>
                                {Number(amount.replace(/,/g, '')) < outstanding && (
                                    <p className="text-[10px] font-bold text-amber-600 mt-1">
                                        {t('adminMandapam.bookings.discountApplied') || 'Discount of'} {formatCurrency(outstanding - Number(amount.replace(/,/g, '')))} {t('adminMandapam.bookings.willBeApplied') || 'will be applied'}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.paymentMethod') || 'Payment Method'}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {FINAL_METHODS.map(pm => (
                                <button
                                    key={pm.value}
                                    onClick={() => setPaymentMethod(pm.value)}
                                    className={`px-3 py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                        paymentMethod === pm.value
                                        ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                        : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                    }`}
                                >
                                    {pm.label}
                                </button>
                            ))}
                        </div>
                        <Input
                            label={t('adminMandapam.bookings.finalPayment') || 'Final Amount'}
                            name="amount"
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={String(Math.max(0, outstanding))}
                            icon="currency_rupee"
                            autoFormat={true}
                        />
                    </div>
                )}
                {mode === 'fully_settled' && !amount && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            {t('adminMandapam.bookings.completeBookingWarning') || 'Marking this as complete will finalize the session. Ensure all payments are cleared.'}
                        </p>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};