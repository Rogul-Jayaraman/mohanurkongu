import React, { useState, useEffect } from 'react';
import { XCircle, Info, ArrowRight, Loader2, BadgeCheck } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import type { Booking, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

const REFUND_OPTIONS: { value: string; label: string; labelTa: string; desc: string; descTa: string; icon: string }[] = [
  { value: 'NO_REFUND', label: 'No Refund', labelTa: 'பணம் திரும்ப இல்லை', desc: 'Forfeit all payments', descTa: 'அனைத்து கட்டணங்களையும் இழக்க', icon: 'block' },
  { value: 'PARTIAL_REFUND', label: 'Partial Refund', labelTa: 'பகுதி பணத்திரும்பம்', desc: 'Refund a portion', descTa: 'ஒரு பகுதியை திருப்ப', icon: 'money_off' },
  { value: 'FULL_REFUND', label: 'Full Refund', labelTa: 'முழு பணத்திரும்பம்', desc: 'Refund entire amount', descTa: 'முழு தொகையையும் திருப்ப', icon: 'currency_rupee' },
];

const REFUND_METHODS: { value: PaymentMethodType; label: string; labelTa: string; icon: string }[] = [
  { value: 'CASH', label: 'Cash', labelTa: 'பணம்', icon: 'payments' },
  { value: 'UPI', label: 'UPI / QR', labelTa: 'UPI / QR', icon: 'qr_code_scanner' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', labelTa: 'வங்கி பரிமாற்றம்', icon: 'account_balance' },
  { value: 'CARD', label: 'Card', labelTa: 'அட்டை', icon: 'credit_card' },
  { value: 'CHEQUE', label: 'Cheque', labelTa: 'காசோலை', icon: 'receipt' },
];

interface CancelRefundModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
    isSubmitting: boolean;
    onConfirm: (booking: Booking, refundType: string, refundAmount: string, refundMethod: string, reason: string) => void;
}

export const CancelRefundModal: React.FC<CancelRefundModalProps> = ({ isOpen, booking, onClose, t, isSubmitting, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [refundOption, setRefundOption] = useState<string>('NO_REFUND');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundMethod, setRefundMethod] = useState<PaymentMethodType>('CASH');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (booking) {
            setRefundOption('NO_REFUND');
            setRefundAmount('');
            setRefundMethod('CASH');
            setReason('');
        }
    }, [booking]);

    if (!booking) return null;

    const isToken = booking.bookingMethod === 'TOKEN_BOOKING';
    const payments = (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const netPaid = payments - refunds;

    const needsRefundEntry = refundOption === 'PARTIAL_REFUND' || refundOption === 'FULL_REFUND';
    const numAmount = refundAmount ? Number(refundAmount.replace(/,/g, '')) : 0;
    const amountValid = refundOption === 'NO_REFUND' || (numAmount > 0 && numAmount <= netPaid);
    const isValid = amountValid && reason.trim().length > 0;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<XCircle size={24} className="text-rose-600" />}
            title={isTamil ? 'ரத்துசெய் மற்றும் பணத்திரும்பம்' : (t('adminMandapam.bookings.cancelBookingTitle') || 'Cancel & Refund')}
            size="sm"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm disabled:opacity-30"
                    >
                        {t('common.cancel') || (isTamil ? 'பின் செல்' : 'Go Back')}
                    </button>
                    <button
                        onClick={() => onConfirm(booking, refundOption, refundAmount, refundMethod, reason)}
                        disabled={!isValid || isSubmitting}
                        className="flex-1 px-6 py-3 bg-rose-700 text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-rose-700/20 active:scale-95 disabled:opacity-30 inline-flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        {isSubmitting
                            ? (t('common.saving') || (isTamil ? 'செயலாக்குகிறது...' : 'Processing...'))
                            : (isTamil ? 'ரத்துசெய்வதை உறுதிப்படுத்து' : (t('adminMandapam.bookings.confirmCancel') || 'Confirm Cancellation'))}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Booking Summary */}
                <div className="bg-gradient-to-br from-rose-50/80 to-white rounded-2xl p-5 border border-rose-200/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-rose-800/40 uppercase tracking-[0.15em] mb-1">
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
                                {isTamil ? 'நிகர செலுத்தம்' : (t('adminMandapam.bookings.paidToDate') || 'Net Paid')}
                            </p>
                            <p className="text-xl font-black text-rose-700">{formatCurrency(netPaid)}</p>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 flex items-start gap-3">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        {isTamil
                            ? 'இது முன்பதிவை ரத்துசெய்து நேர ஒதுக்கீட்டை விடுவிக்கும். இந்த செயலை மாற்ற முடியாது.'
                            : (t('adminMandapam.bookings.cancelBookingWarning') || 'This will cancel the booking and release the slot. This action cannot be undone.')}
                    </p>
                </div>

                {/* Refund Options */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">
                        {isTamil ? 'பணத்திரும்ப தேர்வு' : (t('adminMandapam.bookings.refundStatus') || 'Refund Disposition')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {REFUND_OPTIONS.map(ro => (
                            <button
                                key={ro.value}
                                onClick={() => {
                                    setRefundOption(ro.value);
                                    if (ro.value === 'NO_REFUND') setRefundAmount('');
                                    if (ro.value === 'FULL_REFUND') setRefundAmount(String(netPaid));
                                    if (ro.value === 'PARTIAL_REFUND' && refundOption === 'FULL_REFUND') setRefundAmount('');
                                }}
                                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                    refundOption === ro.value
                                    ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">{ro.icon}</span>
                                {isTamil ? ro.labelTa : ro.label}
                                <span className={`text-[8px] ${refundOption === ro.value ? 'text-ivory/60' : 'text-rosewood/20'}`}>
                                    {isTamil ? ro.descTa : ro.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Refund Details */}
                {needsRefundEntry && (
                    <>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">
                                {isTamil ? 'பணத்திரும்ப முறை' : (t('adminMandapam.bookings.refundMethod') || 'Refund Method')}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {REFUND_METHODS.map(rm => (
                                    <button
                                        key={rm.value}
                                        onClick={() => setRefundMethod(rm.value)}
                                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                            refundMethod === rm.value
                                            ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                            : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{rm.icon}</span>
                                        {isTamil ? rm.labelTa : rm.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            {refundOption === 'FULL_REFUND' ? (
                                <div className="px-4 py-3.5 bg-ivory border border-gold/15 rounded-xl">
                                    <span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5 uppercase">
                                        {isTamil ? 'பணத்திரும்ப தொகை' : (t('adminMandapam.bookings.refundAmount') || 'Refund Amount')}
                                    </span>
                                    <span className="text-lg font-black text-rose-700">{formatCurrency(netPaid)}</span>
                                    <p className="text-[10px] text-rosewood/30 mt-0.5">
                                        {isTamil ? 'முழு பணத்திரும்பம் — தொகை நிர்ணயிக்கப்பட்டது' : 'Full refund — amount is fixed'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[11px] font-bold text-rosewood tracking-tight ml-3 mb-2">
                                        {isTamil ? 'பணத்திரும்ப தொகை' : (t('adminMandapam.bookings.refundAmount') || 'Refund Amount')}
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-rosewood/30 text-[20px]">currency_rupee</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full h-14 pl-12 pr-4 rounded-xl border border-gold/20 text-sm font-medium text-rosewood/70 placeholder:text-rosewood/30 bg-white focus:border-rosewood focus:ring-4 focus:ring-rosewood/5 outline-none transition-all"
                                        />
                                    </div>
                                    {numAmount > netPaid && (
                                        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1 ml-2">
                                            <span className="material-symbols-outlined text-[14px]">error</span>
                                            {isTamil
                                                ? `நிகர செலுத்தம் ${formatCurrency(netPaid)}ஐ தாண்ட முடியாது`
                                                : `Cannot exceed net paid of ${formatCurrency(netPaid)}`}
                                        </p>
                                    )}
                                </div>
                            )}
                            {numAmount > 0 && (
                                <div className="px-4 py-3.5 bg-ivory border border-gold/15 rounded-xl">
                                    <span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5 uppercase">
                                        {isTamil ? 'உறுதிப்படுத்தப்பட்ட பணத்திரும்பம்' : (t('adminMandapam.bookings.confirmedRefundAmount') || 'Refund Amount')}
                                    </span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-black text-rose-700">
                                            {formatCurrency(numAmount)}
                                        </span>
                                        <span className="text-[10px] font-bold text-rosewood/40 flex items-center gap-1">
                                            <ArrowRight size={10} />
                                            {isTamil ? (REFUND_METHODS.find(rm => rm.value === refundMethod)?.labelTa || refundMethod) : refundMethod}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Reason */}
                <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-rosewood tracking-tight ml-3">
                        {isTamil ? 'ரத்துசெய் காரணம்' : (t('adminMandapam.bookings.cancelReason') || 'Cancellation Reason')}
                        <span className="text-rose-500"> *</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={isTamil ? 'எ.கா., வாடிக்கையாளர் கோரிக்கை, தேதி முரண்பாடு' : 'e.g., Customer request, date conflict'}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-gold/20 text-sm font-medium text-rosewood/70 placeholder:text-rosewood/30 bg-white focus:border-rosewood focus:ring-4 focus:ring-rosewood/5 outline-none transition-all resize-none"
                    />
                </div>

                {/* Payment History */}
                {booking.paymentEntries.length > 0 && (
                    <div className="bg-ivory/50 rounded-xl border border-gold/10 p-4">
                        <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-wider mb-2">
                            {isTamil ? 'கட்டண வரலாறு' : (t('adminMandapam.bookings.payments') || 'Existing Payments')}
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
