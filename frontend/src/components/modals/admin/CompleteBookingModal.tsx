import React, { useState, useEffect } from 'react';
import { CheckCircle2, Percent, Landmark, CreditCard, Banknote, Smartphone, Plus, AlertTriangle, Loader2, IndianRupee, Receipt, Calendar, Hash, BadgeCheck } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ta } from 'date-fns/locale';

const METHODS: { value: PaymentMethodType; label: string; labelTa: string; icon: React.ReactNode }[] = [
  { value: 'CASH', label: 'Cash', labelTa: 'பணம்', icon: <Banknote size={16} /> },
  { value: 'UPI', label: 'UPI / QR', labelTa: 'UPI / QR', icon: <Smartphone size={16} /> },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', labelTa: 'வங்கி பரிமாற்றம்', icon: <Landmark size={16} /> },
  { value: 'CARD', label: 'Card', labelTa: 'அட்டை', icon: <CreditCard size={16} /> },
  { value: 'CHEQUE', label: 'Cheque', labelTa: 'காசோலை', icon: <Receipt size={16} /> },
];

const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rosewood/40 mb-3">
    {icon}
    {label}
  </div>
);

interface CompleteBookingModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
    isSubmitting: boolean;
    onConfirm: (booking: Booking, amount: string, paymentMethod: string) => void;
}

export const CompleteBookingModal: React.FC<CompleteBookingModalProps> = ({ isOpen, booking, onClose, t, isSubmitting, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');

    useEffect(() => {
        if (booking) {
            const baseOutstanding = Math.max(0,
                (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0)
                - (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0)
                + (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0)
            );
            setAmount(baseOutstanding > 0 ? String(baseOutstanding) : '');
            setPaymentMethod('CASH');
        }
    }, [booking]);

    if (!booking) return null;

    const baseCharges = (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const payments = (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const outstanding = baseCharges - payments + refunds;
    const numAmount = amount ? Number(amount.replace(/,/g, '')) : 0;
    const isAmountEmpty = amount === '';
    const effectiveAmount = isAmountEmpty ? 0 : numAmount;
    const discount = Math.max(0, outstanding - effectiveAmount);
    const isZeroOutstanding = outstanding <= 0;
    const isToken = booking.bookingMethod === 'TOKEN_BOOKING';
    const hasValidationError = !isAmountEmpty && numAmount > outstanding;
    const isValid = isZeroOutstanding || (!hasValidationError && !isAmountEmpty && effectiveAmount >= 0);

    const needsPaymentInfo = !isZeroOutstanding && effectiveAmount > 0;
    const isFullWriteoff = isAmountEmpty || effectiveAmount === 0;

    const getAmountError = () => {
        if (hasValidationError) {
            return isTamil
                ? `வசூலித்த தொகை நிலுவைத் தொகை ${formatCurrency(outstanding)}ஐ தாண்ட முடியாது`
                : `Collected amount cannot exceed outstanding of ${formatCurrency(outstanding)}`;
        }
        if (!isAmountEmpty && numAmount > baseCharges) {
            return isTamil
                ? `வசூலித்த தொகை மொத்த கட்டணம் ${formatCurrency(baseCharges)}ஐ தாண்ட முடியாது`
                : `Collected amount cannot exceed total charges of ${formatCurrency(baseCharges)}`;
        }
        if (!isAmountEmpty && numAmount < 0) {
            return isTamil ? 'செல்லுபடியாகும் தொகையை உள்ளிடவும்' : 'Enter a valid amount';
        }
        return undefined;
    };

    const amountError = getAmountError();

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<CheckCircle2 size={24} className="text-emerald-600" />}
            title={isTamil ? 'முன்பதிவை நிறைவுசெய்' : (t('adminMandapam.bookings.completeBookingTitle') || 'Complete Booking')}
            size="lg"
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
                        onClick={() => onConfirm(booking, effectiveAmount > 0 ? String(effectiveAmount) : '0', paymentMethod)}
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
                {/* Booking Summary Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gold/10">
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <SectionLabel icon={<Calendar size={12} />} label={isTamil ? 'நிகழ்வு தலைப்பு' : (t('adminMandapam.bookings.eventName') || 'Event Title')} />
                        <h4 className="text-lg font-black text-rosewood leading-tight">
                            {isTamil ? booking.eventTitle.ta : booking.eventTitle.en}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-rosewood/50">
                                <span className="font-bold">{isTamil ? booking.customerName.ta : booking.customerName.en}</span>
                                <span className="text-rosewood/20">·</span>
                                <span className="font-mono">{booking.bookingNo}</span>
                            </div>
                            {isToken && (
                                <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                                    <BadgeCheck size={10} />
                                    {isTamil ? 'டோக்கன்' : 'Token'}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-rosewood/40 mt-1">
                            {format(new Date(booking.bookingConfig.startDate), 'dd MMM yyyy', { locale: isTamil ? ta : undefined })}
                            {booking.bookingConfig.endDate && booking.bookingConfig.endDate !== booking.bookingConfig.startDate &&
                                ` – ${format(new Date(booking.bookingConfig.endDate), 'dd MMM yyyy', { locale: isTamil ? ta : undefined })}`}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-rosewood/40 uppercase tracking-wider">
                            {t('adminMandapam.bookings.outstanding') || 'Due'}
                        </p>
                        <p className={`text-2xl font-black ${outstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {formatCurrency(Math.max(0, outstanding))}
                        </p>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gradient-to-br from-rosewood/[0.02] to-white rounded-2xl p-5 border border-rosewood/10">
                    <div className="flex justify-between text-xs mb-2.5">
                        <span className="font-bold text-rosewood/60">{t('adminMandapam.bookings.totalCharges') || 'Total'}: {formatCurrency(baseCharges)}</span>
                        <span className="font-bold text-emerald-700">{t('adminMandapam.bookings.paidToDate') || 'Paid'}: {formatCurrency(payments)}</span>
                        <span className={`font-bold ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{t('adminMandapam.bookings.outstanding') || 'Due'}: {formatCurrency(outstanding)}</span>
                    </div>
                    <div className="h-2.5 bg-gold/10 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 transition-all rounded-l-full" style={{width: `${baseCharges > 0 ? (payments / baseCharges) * 100 : 0}%`}} />
                        <div className="h-full bg-rose-300 transition-all rounded-r-full" style={{width: `${baseCharges > 0 ? (outstanding / baseCharges) * 100 : 0}%`}} />
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
                    <div className="space-y-5">
                        {/* Payment History */}
                        {booking.paymentEntries.length > 0 && (
                            <div>
                                <SectionLabel icon={<Receipt size={12} />} label={isTamil ? 'கட்டண வரலாறு' : (t('adminMandapam.bookings.payments') || 'Payment History')} />
                                <div className="space-y-1.5">
                                    {booking.paymentEntries.map(p => (
                                        <div key={p.id} className="flex justify-between items-center text-xs py-2.5 px-3 bg-white rounded-lg border border-gold/10 hover:border-gold/20 transition-colors">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                                <span className="font-semibold text-rosewood/60 truncate">
                                                    {p.paymentType === 'ADVANCE' ? (t('adminMandapam.bookings.advanceAmount') || 'Advance') : p.paymentType === 'FINAL_PAYMENT' ? (t('adminMandapam.bookings.finalPayment') || 'Final') : p.paymentType.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-rosewood/20">·</span>
                                                <span className="text-rosewood/50">{p.paymentMethod}</span>
                                            </div>
                                            <span className="font-bold text-emerald-700 shrink-0 ml-3">{formatCurrency(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Collection */}
                        <div className="space-y-4">
                            <div>
                                <SectionLabel icon={<IndianRupee size={12} />} label={isTamil ? 'பெறப்பட்ட கட்டணம்' : (t('adminMandapam.bookings.amountCollected') || 'Payment Received')} />

                                {isFullWriteoff && outstanding > 0 && (
                                    <div className="bg-rose-50 border-l-4 border-rose-500 rounded-xl p-3 mb-3 flex items-start gap-2.5">
                                        <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-rose-900">
                                                {isTamil
                                                    ? 'முழு நிலுவைத் தொகையும் தள்ளுபடி செய்யப்படும்'
                                                    : 'Entire amount due will be written off'}
                                            </p>
                                            <p className="text-[10px] text-rose-700/70 mt-0.5">
                                                {isTamil
                                                    ? `₹0 வசூலிக்கப்பட்டது - ${formatCurrency(outstanding)} தள்ளுபடி செய்யப்படும்`
                                                    : `₹0 collected — ${formatCurrency(outstanding)} will be written off`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <Input
                                    label={isTamil ? 'பெறப்பட்ட கட்டணம்' : 'Payment Received'}
                                    icon="payments"
                                    name="amount"
                                    type="text"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={String(Math.max(0, outstanding))}
                                    error={amountError}
                                />

                                {effectiveAmount > 0 && effectiveAmount <= outstanding && (
                                    <div className="mt-3 bg-white rounded-xl border border-gold/10 p-3 space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-rosewood/60">{isTamil ? 'வசூலிக்கப்பட்டது' : 'Received'}</span>
                                            <span className="font-bold text-emerald-700">{formatCurrency(effectiveAmount)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-rosewood/60">{isTamil ? 'தள்ளுபடி செய்யப்பட்டது' : 'Written Off'}</span>
                                                <span className="font-bold text-amber-600">-{formatCurrency(discount)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-dashed border-gold/20 pt-1.5 flex justify-between text-xs font-bold">
                                            <span className="text-rosewood">{isTamil ? 'நிலுவை' : 'Amount Due'}</span>
                                            <span className="text-rosewood">{formatCurrency(outstanding)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            {needsPaymentInfo && (
                                <div>
                                    <SectionLabel icon={<CreditCard size={12} />} label={isTamil ? 'கட்டண முறை' : (t('adminMandapam.bookings.paymentMethod') || 'Payment Method')} />
                                    <div className="grid grid-cols-5 gap-2">
                                        {METHODS.map(pm => (
                                            <button
                                                key={pm.value}
                                                onClick={() => setPaymentMethod(pm.value)}
                                                className={`flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                                    paymentMethod === pm.value
                                                    ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30 hover:shadow-sm'
                                                }`}
                                            >
                                                <span className={paymentMethod === pm.value ? 'text-ivory' : 'text-rosewood/50'}>{pm.icon}</span>
                                                {isTamil ? pm.labelTa : pm.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};
