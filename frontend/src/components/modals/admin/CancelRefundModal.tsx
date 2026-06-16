import React, { useState, useEffect } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

const REFUND_OPTIONS: { value: string; label: string; labelTa: string; desc: string; descTa: string; icon: string }[] = [
  { value: 'NO_REFUND', label: 'No Refund', labelTa: 'பணம் திரும்ப இல்லை', desc: 'Keep all payments', descTa: 'அனைத்து கட்டணங்களையும் வைத்திருக்க', icon: 'block' },
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
            title={t('adminMandapam.bookings.cancelBookingTitle') || 'Cancel & Refund'}
            size="md"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm active:scale-[0.97] disabled:opacity-30"
                    >
                        {t('common.cancel') || 'Go Back'}
                    </button>
                    <button
                        onClick={() => onConfirm(booking, refundOption, refundAmount, refundMethod, reason)}
                        disabled={!isValid || isSubmitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-700 to-rose-600 text-ivory font-bold rounded-xl hover:shadow-xl transition-all text-sm shadow-lg shadow-rose-700/20 active:scale-[0.97] disabled:opacity-30 inline-flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        {isSubmitting
                            ? (t('common.saving') || 'Processing...')
                            : (t('adminMandapam.bookings.confirmCancel') || 'Confirm Cancellation')}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Booking Summary */}
                <div className="bg-gradient-to-br from-rose-50/80 to-white rounded-2xl p-5 border border-rose-200/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-rose-800/40 mb-1">
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
                                {t('adminMandapam.bookings.netPaid') || 'Amount Paid'}
                            </p>
                            <p className="text-xl font-black text-rose-700">{formatCurrency(netPaid)}</p>
                        </div>
                    </div>
                </div>

                {/* Danger Warning Banner */}
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                        <XCircle size={22} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-rose-800 mb-1">
                            {t('adminMandapam.bookings.cancelBookingWarning') || 'This will cancel the booking and release the slot.'}
                        </p>
                        <p className="text-xs font-medium text-rose-600">
                            {isTamil ? 'இந்த செயலை மீளமுடியாது. தயவுசெய்து பணத்திரும்ப விவரங்களைச் சரிபார்க்கவும்.' : 'This action cannot be undone. Please review the refund details below before proceeding.'}
                        </p>
                    </div>
                </div>

                {/* Refund Options */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-rosewood/40 ml-1">
                        {t('adminMandapam.bookings.refundStatus') || 'Refund Option'}
                    </p>
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
                            <p className="text-[10px] font-bold text-rosewood/40 ml-1">
                                {t('adminMandapam.bookings.refundMethod') || 'Refund Method'}
                            </p>
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
                                <p className="text-[10px] font-bold text-rosewood/40 mb-0.5">
                                    {t('adminMandapam.bookings.refundAmount') || 'Refund Amount'}
                                </p>
                                <p className="text-lg font-black text-rose-700">{formatCurrency(netPaid)}</p>
                                <p className="text-[10px] text-rosewood/30 mt-0.5">
                                    {t('adminMandapam.bookings.fullRefundFixed') || 'Full refund — amount is fixed'}
                                </p>
                                </div>
                            ) : (
                                <div>
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
                                    {numAmount > netPaid && (
                                        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1 ml-2">
                                            <span className="material-symbols-outlined text-[14px]">error</span>
                                            {isTamil
                                            ? `செலுத்தப்பட்ட தொகை ${formatCurrency(netPaid)}ஐ தாண்ட முடியாது`
                                            : `Cannot exceed amount paid of ${formatCurrency(netPaid)}`}
                                        </p>
                                    )}
                                </div>
                            )}
                            {numAmount > 0 && (
                                <div className="px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-700">
                                            {t('adminMandapam.bookings.confirmedRefundAmount') || 'Confirmed Refund'}
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-0.5">
                                            via {isTamil ? (REFUND_METHODS.find(rm => rm.value === refundMethod)?.labelTa || refundMethod) : refundMethod}
                                        </p>
                                    </div>
                                    <span className="text-xl font-black text-rose-700">{formatCurrency(numAmount)}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Reason */}
                <div className="space-y-2">
                    <p className="block text-[11px] font-bold text-rosewood ml-3">
                        {t('adminMandapam.bookings.cancelReason') || 'Cancellation Reason'}
                        <span className="text-rose-500"> *</span>
                    </p>
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
                        <p className="text-[10px] font-bold text-rosewood/40 mb-2">
                            {t('adminMandapam.bookings.payments') || 'Existing Payments'}
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
