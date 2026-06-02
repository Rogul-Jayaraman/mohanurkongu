import React, { useState, useEffect } from 'react';
import { CreditCard, BadgeCheck, Loader2 } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, PaymentEntryType, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

const PAYMENT_TYPES: { value: PaymentEntryType; label: string; labelTa: string; desc: string; descTa: string }[] = [
  { value: 'ADVANCE', label: 'Advance', labelTa: 'முன்பணம்', desc: 'Partial upfront payment', descTa: 'பகுதி முன்பணம்' },
  { value: 'INSTALLMENT', label: 'Installment', labelTa: 'தவணை', desc: 'Mid-way payment', descTa: 'இடைநிலை கட்டணம்' },
  { value: 'FINAL_PAYMENT', label: 'Final Payment', labelTa: 'இறுதி கட்டணம்', desc: 'Settle remaining balance', descTa: 'மீதியை செலுத்துக' },
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
    onConfirm: (booking: Booking, paymentType: string, amount: string, paymentMethod: string, referenceNo: string, notes: string) => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, booking, onClose, t, isSubmitting, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [paymentType, setPaymentType] = useState<PaymentEntryType>('ADVANCE');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
    const [amount, setAmount] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (booking) {
            setAmount('');
            setPaymentType('ADVANCE');
            setPaymentMethod('CASH');
            setReferenceNo('');
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
            title={isTamil ? 'கட்டணம் சேர்க்க' : (t('adminMandapam.bookings.updatePayment') || 'Add Payment')}
            size="sm"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm disabled:opacity-30"
                    >
                        {t('common.cancel') || (isTamil ? 'ரத்துசெய்' : 'Cancel')}
                    </button>
                    <button
                        onClick={() => onConfirm(booking, paymentType, amount, paymentMethod, referenceNo, notes)}
                        disabled={!isValid || isSubmitting}
                        className="flex-1 px-6 py-3 bg-rosewood text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-rosewood/20 active:scale-95 disabled:opacity-30 inline-flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                        {isSubmitting
                            ? (t('common.saving') || (isTamil ? 'சேமிக்கிறது...' : 'Saving...'))
                            : (isTamil ? 'சேமி' : (t('common.saveChanges') || 'Save Payment'))}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Booking Summary */}
                <div className="bg-gradient-to-br from-gold/5 to-white rounded-2xl p-5 border border-gold/15">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-[0.15em] mb-1">
                                {t('adminMandapam.bookings.eventName') || 'Event Name'}
                            </p>
                            <p className="text-base font-black text-rosewood tracking-tight truncate">
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
                            <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">
                                {t('adminMandapam.bookings.outstanding') || 'Due'}
                            </p>
                            <p className={`text-xl font-black ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatCurrency(Math.max(0, outstanding))}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gold/10">
                        <div>
                            <p className="text-[9px] font-bold text-rosewood/30 uppercase tracking-wider">
                                {t('adminMandapam.bookings.totalCharges') || 'Total'}
                            </p>
                            <p className="text-sm font-black text-rosewood">{formatCurrency(charges)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-rosewood/30 uppercase tracking-wider">
                                {t('adminMandapam.bookings.paidToDate') || 'Paid'}
                            </p>
                            <p className="text-sm font-black text-emerald-700">{formatCurrency(payments)}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Type */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">
                        {isTamil ? 'கட்டண வகை' : (t('adminMandapam.bookings.paymentType') || 'Payment Type')}
                    </label>
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
                    <label className="text-[10px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">
                        {isTamil ? 'கட்டண முறை' : (t('adminMandapam.bookings.paymentMethod') || 'Payment Method')}
                    </label>
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
                        label={isTamil ? 'கட்டணத் தொகை' : (t('adminMandapam.bookings.advanceAmount') || 'Payment Amount')}
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
                        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 ml-2">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            {isTamil
                                ? `தொகை நிலுவைத் ${formatCurrency(Math.max(0, outstanding))}ஐ தாண்டுகிறது`
                                : `Amount exceeds due of ${formatCurrency(Math.max(0, outstanding))}`}
                        </p>
                    )}
                    <Input
                        label={(isTamil ? 'குறிப்பு எண் (விருப்பம்)' : (t('adminMandapam.bookings.referenceNo') || 'Reference No.') + ' (optional)')}
                        name="referenceNo"
                        type="text"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder={isTamil ? 'எ.கா., காசோலை #1234' : 'e.g., Cheque #1234'}
                        icon="tag"
                    />
                    <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-rosewood tracking-tight ml-3">
                            {(isTamil ? 'குறிப்புகள் (விருப்பம்)' : (t('adminMandapam.bookings.notes') || 'Notes') + ' (optional)')}
                        </label>
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
                        <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-wider mb-2">
                            {isTamil ? 'கட்டண வரலாறு' : (t('adminMandapam.bookings.payments') || 'Payment History')}
                        </p>
                        <div className="space-y-1.5">
                            {booking.paymentEntries.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-gold/5">
                                    <span className="font-bold text-rosewood/60 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                        {p.paymentType.replace(/_/g, ' ')} · {p.paymentMethod}
                                        {p.referenceNo && <span className="text-rosewood/30">· {p.referenceNo}</span>}
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
