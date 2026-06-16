import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, PaymentEntryType, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

const PAYMENT_TYPES: { value: PaymentEntryType; label: string; labelTa: string; desc: string; descTa: string }[] = [
  { value: 'ADVANCE', label: 'Deposit', labelTa: 'முன்பணம்', desc: 'Partial upfront payment', descTa: 'பகுதி முன்பணம்' },
  { value: 'INSTALLMENT', label: 'Partial Payment', labelTa: 'தவணை', desc: 'Mid-way payment', descTa: 'இடைநிலை கட்டணம்' },
  { value: 'FINAL_PAYMENT', label: 'Balance Payment', labelTa: 'மீதி கட்டணம்', desc: 'Pay remaining balance', descTa: 'மீதியை செலுத்துக' },
];

const PAYMENT_METHODS: { value: PaymentMethodType; label: string; labelTa: string; icon: string }[] = [
  { value: 'CASH', label: 'Cash', labelTa: 'பணம்', icon: 'payments' },
  { value: 'UPI', label: 'UPI / QR', labelTa: 'UPI / QR', icon: 'qr_code_scanner' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', labelTa: 'வங்கி பரிமாற்றம்', icon: 'account_balance' },
  { value: 'CARD', label: 'Card', labelTa: 'அட்டை', icon: 'credit_card' },
  { value: 'CHEQUE', label: 'Cheque', labelTa: 'காசோலை', icon: 'receipt' },
];

interface AddPaymentModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
    isSubmitting: boolean;
    onConfirm: (booking: Booking, paymentType: string, amount: string, paymentMethod: string, notes: string) => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, booking, onClose, t, isSubmitting, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [paymentType, setPaymentType] = useState<PaymentEntryType>('ADVANCE');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (booking) {
            setAmount('');
            setPaymentType('ADVANCE');
            setPaymentMethod('CASH');
            setNotes('');
        }
    }, [booking]);

    if (!booking) return null;

    const isToken = booking.bookingMethod === 'TOKEN_BOOKING';
    const charges = (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const payments = (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const outstanding = charges - payments + refunds;
    const numAmount = amount ? Number(amount.replace(/,/g, '')) : 0;
    const exceedsDue = numAmount > Math.max(0, outstanding);
    const isValid = numAmount > 0 && !exceedsDue;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<CreditCard size={24} className="text-rosewood" />}
            title={t('adminMandapam.bookings.updatePayment') || 'Add Payment'}
            size="md"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm active:scale-[0.97] disabled:opacity-30"
                    >
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                        onClick={() => onConfirm(booking, paymentType, amount, paymentMethod, notes)}
                        disabled={!isValid || isSubmitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-rosewood to-dark-rosewood text-ivory font-bold rounded-xl hover:shadow-xl transition-all text-sm shadow-lg shadow-rosewood/20 active:scale-[0.97] disabled:opacity-30 inline-flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                        {isSubmitting
                            ? (t('common.saving') || 'Saving...')
                            : (t('common.saveChanges') || 'Save')}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Booking Summary */}
                <div className="bg-gradient-to-br from-gold/5 to-white rounded-2xl p-5 border border-gold/15">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-rosewood/40 mb-1">
                                {t('adminMandapam.bookings.eventName') || 'Event Name'}
                            </p>
                            <p className="text-base font-black text-rosewood truncate">
                                {isTamil ? booking.eventTitle.ta : booking.eventTitle.en}
                            </p>
                            <p className="text-xs font-bold text-rosewood/50 mt-1 truncate">
                                {isTamil ? booking.customerName.ta : booking.customerName.en} · {booking.bookingNo}
                                {isToken && (
                                    <span className="ml-1.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                        {isTamil ? 'டோக்கன்' : 'Token'}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold text-rosewood/40 mb-1">
                                {t('adminMandapam.bookings.outstanding') || 'Due'}
                            </p>
                            <p className={`text-xl font-black ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatCurrency(Math.max(0, outstanding))}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gold/10">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-bold text-rosewood/50">{t('adminMandapam.bookings.totalCharges') || 'Total'}: {formatCurrency(charges)}</span>
                            <span className="font-bold text-emerald-700">{t('adminMandapam.bookings.paidToDate') || 'Paid'}: {formatCurrency(payments)}</span>
                        </div>
                        <div className="h-2 bg-gold/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width: `${charges > 0 ? (payments / charges) * 100 : 0}%`}} />
                        </div>
                    </div>
                </div>

                {/* Payment Type */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-rosewood/40 ml-1">
                        {t('adminMandapam.bookings.paymentType') || 'Payment Type'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PAYMENT_TYPES.map(pt => (
                            <button
                                key={pt.value}
                                onClick={() => setPaymentType(pt.value)}
                                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                    paymentType === pt.value
                                    ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">{pt.value === 'ADVANCE' ? 'wallet' : pt.value === 'INSTALLMENT' ? 'installments' : 'payments'}</span>
                                {isTamil ? pt.labelTa : pt.label}
                                <span className={`text-[8px] ${paymentType === pt.value ? 'text-ivory/60' : 'text-rosewood/20'}`}>
                                    {isTamil ? pt.descTa : pt.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-rosewood/40 ml-1">
                        {t('adminMandapam.bookings.paymentMethod') || 'Payment Method'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map(pm => (
                            <button
                                key={pm.value}
                                onClick={() => setPaymentMethod(pm.value)}
                                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                    paymentMethod === pm.value
                                    ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">{pm.icon}</span>
                                {isTamil ? pm.labelTa : pm.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount + Reference + Notes */}
                <div className="space-y-3">
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
                    {exceedsDue && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
                            <span className="material-symbols-outlined text-rose-500 text-lg">error</span>
                            <p className="text-xs font-bold text-rose-700">
                                {isTamil
                                    ? `தொகை நிலுவைத் ${formatCurrency(Math.max(0, outstanding))}ஐ தாண்டுகிறது`
                                    : `Amount exceeds remaining of ${formatCurrency(Math.max(0, outstanding))}`}
                            </p>
                        </div>
                    )}
                    {numAmount > 0 && !exceedsDue && (
                        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-700">
                                    {t('adminMandapam.bookings.confirmedPaymentAmount') || 'After Payment'}
                                </p>
                                    <p className="text-xs font-medium text-emerald-600">
                                        {formatCurrency(Math.max(0, outstanding - numAmount))} left to pay
                                    </p>
                            </div>
                            <span className="text-lg font-black text-emerald-700">{formatCurrency(numAmount)}</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="block text-[11px] font-bold text-rosewood ml-3">
                            {t('adminMandapam.bookings.notes') || 'Notes (optional)'}
                        </p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isTamil ? 'எ.கா., கிளையில் காசோலை மூலம் செலுத்தப்பட்டது' : 'e.g., Paid via cheque at branch'}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-gold/20 text-sm font-medium text-rosewood/70 placeholder:text-rosewood/30 bg-white focus:border-rosewood focus:ring-4 focus:ring-rosewood/5 outline-none transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Payment History */}
                {booking.paymentEntries.length > 0 && (
                    <div className="bg-ivory/50 rounded-xl border border-gold/10 p-4">
                        <p className="text-[10px] font-bold text-rosewood/40 mb-2">
                            {t('adminMandapam.bookings.payments') || 'Payment History'}
                        </p>
                        <div className="space-y-1.5">
                            {booking.paymentEntries.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-gold/5">
                                    <span className="font-bold text-rosewood/60 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                        {p.paymentType.replace(/_/g, ' ')} · {p.paymentMethod}
                                    </span>
                                    <span className="font-black text-emerald-700">{formatCurrency(p.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};
