import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import type { Booking } from '@/types/mandapam';
import { useLanguage } from '@/context/LanguageContext';

interface CancelConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    booking: Booking | null;
    t: any;
}

export const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({ isOpen, onClose, onConfirm, booking, t }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<AlertCircle size={24} className="text-red-500" />}
            title={t('adminMandapam.bookings.cancelBookingTitle') || 'Cancel Booking'}
            size="sm"
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gold/10 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm"
                    >
                        {t('common.cancel') || 'No, Keep Booking'}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm"
                    >
                        {t('adminMandapam.bookings.confirmCancel') || 'Yes, Cancel Booking'}
                    </button>
                </div>
            }
        >
            <p className="text-sm text-rosewood/60">
                {t('adminMandapam.bookings.cancelConfirmationPrompt') || 'Are you sure you want to cancel this booking? This will release the calendar slot and reverse any tokens.'}
            </p>
            {booking && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 space-y-1">
                    <p className="text-xs font-black text-red-800">{isTamil ? booking.eventTitle.ta : booking.eventTitle.en}</p>
                    <p className="text-[10px] text-red-600">{booking.bookingNo} · {isTamil ? booking.customerName.ta : booking.customerName.en}</p>
                </div>
            )}
        </ModalShell>
    );
};