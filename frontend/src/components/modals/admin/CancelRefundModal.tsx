import React, { useState, useEffect } from 'react';
import { Info, XCircle } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { Input } from '@/components/ui/forms/Input';
import type { Booking, RefundType, PaymentMethodType } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

const REFUND_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'No Refund' },
  { value: 'PARTIAL_REFUND', label: 'Partial Refund' },
  { value: 'FULL_REFUND', label: 'Full Refund' },
];

const REFUND_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / QR' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'CHEQUE', label: 'Cheque' },
];

interface CancelRefundModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
    onConfirm: (booking: Booking, refundType: string, refundAmount: string, refundMethod: string) => void;
}

export const CancelRefundModal: React.FC<CancelRefundModalProps> = ({ isOpen, booking, onClose, t, onConfirm }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [refundOption, setRefundOption] = useState<string>('none');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundMethod, setRefundMethod] = useState<PaymentMethodType>('CASH');

    useEffect(() => {
        if (booking) {
            setRefundOption('none');
            setRefundAmount('');
            setRefundMethod('CASH');
        }
    }, [booking]);

    if (!booking) return null;

    const payments = (booking.paymentEntries || []).reduce((s, e) => s + e.amount, 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + e.amount, 0);
    const netPaid = payments - refunds;

    const needsRefundEntry = refundOption === 'PARTIAL_REFUND' || refundOption === 'FULL_REFUND';

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<XCircle size={24} className="text-rose-600" />}
            title={t('adminMandapam.bookings.cancelBookingTitle') || 'Cancel Booking'}
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
                        onClick={() => onConfirm(booking, refundOption === 'none' ? 'NO_REFUND' : refundOption, refundAmount, refundMethod)}
                        className="flex-1 px-6 py-3 bg-rose-700 text-ivory font-bold rounded-xl hover:shadow-lg transition-all text-sm shadow-lg shadow-rose-700/20 active:scale-95"
                    >
                        {t('adminMandapam.bookings.confirmCancel') || 'Confirm Cancellation'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-600/10">
                    <p className="text-[10px] font-black text-rose-800/40 uppercase tracking-[0.15em] mb-1">{t('adminMandapam.bookings.eventName') || 'Event Name'}</p>
                    <p className="text-base font-black text-rosewood tracking-tight">{isTamil ? booking.eventTitle.ta : booking.eventTitle.en}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-rose-600/5">
                        <p className="text-xs font-bold text-rosewood/60">{isTamil ? booking.customerName.ta : booking.customerName.en}</p>
                        <p className="text-xs font-black text-rose-700">{t('adminMandapam.bookings.paidToDate') || 'Paid'}: {formatCurrency(netPaid)}</p>
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
                    <div className="grid grid-cols-3 gap-2">
                        {REFUND_OPTIONS.map(ro => (
                            <button
                                key={ro.value}
                                onClick={() => setRefundOption(ro.value)}
                                className={`px-3 py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                    refundOption === ro.value
                                    ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                    : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                }`}
                            >
                                {ro.label}
                            </button>
                        ))}
                    </div>
                </div>
                {needsRefundEntry && (
                    <>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.refundMethod') || 'Refund Method'}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {REFUND_METHODS.map(rm => (
                                    <button
                                        key={rm.value}
                                        onClick={() => setRefundMethod(rm.value)}
                                        className={`px-3 py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                            refundMethod === rm.value
                                            ? 'bg-rosewood text-ivory border-rosewood shadow-md'
                                            : 'bg-white text-rosewood/40 border-gold/10 hover:border-gold/30'
                                        }`}
                                    >
                                        {rm.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Input
                                label={t('adminMandapam.bookings.refundAmount') || 'Refund Amount'}
                                name="refundAmount"
                                type="text"
                                inputMode="decimal"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                placeholder={refundOption === 'FULL_REFUND' ? String(netPaid) : '0.00'}
                                icon="currency_rupee"
                                autoFormat={true}
                            />
                            {refundAmount && Number(refundAmount.replace(/,/g, '')) > 0 && (
                                <div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl">
                                    <span className="text-[10px] font-black text-rosewood/40 tracking-wider block mb-0.5 uppercase">
                                        {t('adminMandapam.bookings.confirmedRefundAmount') || 'CONFIRMED REFUND AMOUNT'}
                                    </span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-black text-rosewood">
                                            {formatCurrency(Number(refundAmount.replace(/,/g, '')))}
                                        </span>
                                        <span className="text-[10px] font-bold text-rosewood/40">
                                            {t('adminMandapam.bookings.via') || 'via'} {refundMethod}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ModalShell>
    );
};