import React, { useState, useEffect } from 'react';
import { CheckCircle2, Wallet, Hash, ArrowRight, Loader2, BadgeCheck } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

type CompletionMode = 'fully_settled' | 'discount';

const METHODS: { value: PaymentMethodType; label: string; labelTa: string; icon: string }[] = [
  { value: 'CASH', label: 'Cash', labelTa: 'பணம்', icon: 'payments' },
  { value: 'UPI', label: 'UPI / QR', labelTa: 'UPI / QR', icon: 'qr_code_scanner' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', labelTa: 'வங்கி பரிமாற்றம்', icon: 'account_balance' },
  { value: 'CARD', label: 'Card', labelTa: 'அட்டை', icon: 'credit_card' },
  { value: 'CHEQUE', label: 'Cheque', labelTa: 'காசோலை', icon: 'receipt' },
];

interface CompleteBookingModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
    isSubmitting: boolean;
    onConfirm: (booking: Booking, mode: string, amount: string, paymentMethod: string) => void;
}

export const CompleteBookingModal: React.FC<CompleteBookingModalProps> = ({ isOpen, booking, onClose, t, isSubmitting, onConfirm }) => {
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

    const charges = (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const payments = (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const outstanding = charges - payments + refunds;
    const numAmount = amount ? Number(amount.replace(/,/g, '')) : 0;
    const isZeroOutstanding = outstanding <= 0;
    const maxCollect = Math.max(0, outstanding);
    const isToken = booking.bookingMethod === 'TOKEN_BOOKING';
    const isValid = isZeroOutstanding || (mode === 'fully_settled' && numAmount >= 0) || (mode === 'discount' && numAmount > 0 && numAmount <= charges);

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<CheckCircle2 size={24} className="text-emerald-600" />}
            title={isTamil ? 'முன்பதிவை நிறைவுசெய்' : (t('adminMandapam.bookings.completeBookingTitle') || 'Complete Booking')}
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
                        onClick={() => onConfirm(booking, mode, amount, paymentMethod)}
                        disabled={!isValid || isSubmitting}
                        className="flex-1 px-6 py-3 bg-emerald-700 text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-emerald-700/20 active:scale-95 disabled:opacity-30 inline-flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {isSubmitting
                            ? (t('common.saving') || (isTamil ? 'செயலாக்குகிறது...' : 'Processing...'))
                            : (isTamil ? 'இறுதிசெய் & நிறைவுசெய்' : (t('adminMandapam.bookings.confirmComplete') || 'Finalize & Complete'))}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Booking Summary */}
                <div className="bg-gradient-to-br from-emerald-50/80 to-white rounded-2xl p-5 border border-emerald-200/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.15em] mb-1">
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
                            <p className={`text-xl font-black ${isZeroOutstanding ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatCurrency(outstanding)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Zero outstanding banner */}
                {isZeroOutstanding ? (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900">
                                {isTamil ? 'நிலுவை தொகை இல்லை' : (t('adminMandapam.bookings.noOutstanding') || 'No outstanding balance')}
                            </p>
                            <p className="text-xs text-emerald-700/70 mt-0.5">
                                {isTamil
                                    ? 'அனைத்து கட்டணங்களும் வசூலிக்கப்பட்டன. நிறைவுசெய்ய உறுதிப்படுத்தவும்.'
                                    : (t('adminMandapam.bookings.completeNoPayment') || 'All payments collected. Just confirm to complete.')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mode Selection */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">
                                {isTamil ? 'தீர்வு முறை' : (t('adminMandapam.bookings.closeoutStatus') || 'Settlement Mode')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button
                                    onClick={() => setMode('fully_settled')}
                                    className={`px-4 py-3.5 rounded-xl border-2 text-xs font-bold transition-all text-left ${
                                        mode === 'fully_settled'
                                        ? 'bg-emerald-700 text-ivory border-emerald-700 shadow-md'
                                        : 'bg-white text-rosewood/50 border-gold/10 hover:border-gold/30'
                                    }`}
                                >
                                    <Wallet size={16} className={mode === 'fully_settled' ? 'text-ivory' : 'text-emerald-600'} />
                                    <span className="block mt-1">{isTamil ? 'முழு தீர்வு' : (t('adminMandapam.bookings.fullyPaid') || 'Full Settlement')}</span>
                                    <span className={`block text-[10px] mt-0.5 ${mode === 'fully_settled' ? 'text-emerald-100' : 'text-rosewood/30'}`}>
                                        {isTamil ? 'மீதி தொகையை வசூலிக்கவும்' : (t('adminMandapam.bookings.fullyPaidDesc') || 'Collect remaining amount')}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setMode('discount')}
                                    className={`px-4 py-3.5 rounded-xl border-2 text-xs font-bold transition-all text-left ${
                                        mode === 'discount'
                                        ? 'bg-amber-600 text-ivory border-amber-600 shadow-md'
                                        : 'bg-white text-rosewood/50 border-gold/10 hover:border-gold/30'
                                    }`}
                                >
                                    <Hash size={16} className={mode === 'discount' ? 'text-ivory' : 'text-amber-600'} />
                                    <span className="block mt-1">{isTamil ? 'தள்ளுபடி' : (t('adminMandapam.bookings.discounted') || 'Apply Discount')}</span>
                                    <span className={`block text-[10px] mt-0.5 ${mode === 'discount' ? 'text-amber-100' : 'text-rosewood/30'}`}>
                                        {isTamil ? 'இறுதி தொகையை சரிசெய்யவும்' : 'Adjust final amount'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Mode-specific fields */}
                        {mode === 'discount' ? (
                            <div className="space-y-3">
                                <Input
                                    label={isTamil ? 'வசூலிக்க வேண்டிய இறுதி தொகை' : (t('adminMandapam.bookings.finalPayment') || 'Final Amount to Collect')}
                                    name="amount"
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={String(maxCollect)}
                                    icon="currency_rupee"
                                    autoFormat={true}
                                />
                                {numAmount > 0 && (
                                    <div className="px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                                        <span className="text-[10px] font-black text-amber-800/40 tracking-wider block mb-0.5 uppercase">
                                            {isTamil ? 'இறுதி வசூல்' : (t('adminMandapam.bookings.finalAmount') || 'Final Collection')}
                                        </span>
                                        <span className="text-lg font-black text-amber-900">
                                            {formatCurrency(numAmount)}
                                        </span>
                                        {numAmount < outstanding && (
                                            <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                                                <ArrowRight size={10} />
                                                {isTamil
                                                    ? `${formatCurrency(outstanding - numAmount)} தள்ளுபடி`
                                                    : `${t('adminMandapam.bookings.discountApplied') || 'Discount of'} ${formatCurrency(outstanding - numAmount)} ${t('adminMandapam.bookings.willBeApplied') || 'applied'}`}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {numAmount > charges && (
                                    <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 ml-2">
                                        <span className="material-symbols-outlined text-[14px]">error</span>
                                        {isTamil
                                            ? `இறுதி தொகை மொத்த கட்டணம் ${formatCurrency(charges)}ஐ தாண்ட முடியாது`
                                            : `Final amount cannot exceed total charges of ${formatCurrency(charges)}`}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">
                                    {isTamil ? 'கட்டண முறை' : (t('adminMandapam.bookings.paymentMethod') || 'Payment Method')}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {METHODS.map(pm => (
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
                                <Input
                                    label={isTamil ? 'இறுதி தொகை' : (t('adminMandapam.bookings.finalPayment') || 'Final Amount')}
                                    name="amount"
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={String(maxCollect)}
                                    icon="currency_rupee"
                                    autoFormat={true}
                                />
                            </div>
                        )}
                    </>
                )}

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
