import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, DollarSign } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, PaymentEntryType, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

const PAYMENT_TYPES: { value: PaymentEntryType; label: string }[] = [
  { value: 'ADVANCE', label: 'Advance' },
  { value: 'INSTALLMENT', label: 'Installment' },
  { value: 'FINAL_PAYMENT', label: 'Final Payment' },
];

const PAYMENT_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / QR' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'CHEQUE', label: 'Cheque' },
];

interface ModifyPaymentModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
    onConfirm: (booking: Booking, paymentType: string, amount: string, paymentMethod: string) => void;
}

export const ModifyPaymentModal: React.FC<ModifyPaymentModalProps> = ({ isOpen, booking, onClose, t, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [paymentType, setPaymentType] = useState<PaymentEntryType>('ADVANCE');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (booking) {
            setAmount('');
            setPaymentType('ADVANCE');
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
            icon={<CreditCard size={24} className="text-rosewood" />}
            title={t('adminMandapam.bookings.updatePayment') || 'Update Payment'}
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
                        onClick={() => onConfirm(booking, paymentType, amount, paymentMethod)}
                        disabled={!amount || Number(amount.replace(/,/g, '')) <= 0}
                        className="flex-1 px-6 py-3 bg-rosewood text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-rosewood/20 active:scale-95 disabled:opacity-30"
                    >
                        {t('common.saveChanges') || 'Save Changes'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-gold/5 p-4 rounded-xl border border-gold/10">
                    <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-[0.15em] mb-1">{t('adminMandapam.bookings.eventName') || 'Event Name'}</p>
                    <p className="text-base font-black text-rosewood tracking-tight">{isTamil ? booking.eventTitle.ta : booking.eventTitle.en}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gold/5">
                        <p className="text-xs font-bold text-rosewood/60">{isTamil ? booking.customerName.ta : booking.customerName.en}</p>
                        <p className="text-xs font-black text-rosewood">{t('adminMandapam.bookings.outstanding') || 'Due'}: {formatCurrency(outstanding)}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.paymentType') || 'Payment Type'}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_TYPES.map(pt => (
                            <button
                                key={pt.value}
                                onClick={() => setPaymentType(pt.value)}
                                className={`px-3 py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                    paymentType === pt.value
                                    ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                }`}
                            >
                                {pt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.paymentMethod') || 'Payment Method'}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map(pm => (
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
                </div>

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
                    {amount && Number(amount.replace(/,/g, '')) > 0 && (
                        <div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-500">
                            <span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5 uppercase">
                                {t('adminMandapam.bookings.confirmedPaymentAmount') || 'CONFIRMED PAYMENT AMOUNT'}
                            </span>
                            <div className="flex justify-between items-center">
                                <span className="text-base font-black text-rosewood">
                                    {formatCurrency(Number(amount.replace(/,/g, '')))}
                                </span>
                                <span className="text-[10px] font-bold text-rosewood/40">
                                    {t('adminMandapam.bookings.via') || 'via'} {paymentMethod}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalShell>
    );
};