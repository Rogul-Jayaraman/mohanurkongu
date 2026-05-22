import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import type { MandapamBooking } from '@/services/mandapamService';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    booking: MandapamBooking | null;
    t: any;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, booking, t }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            scrollToTop();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onClose()}
                        className="absolute inset-0 bg-gold-soft/10 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-gold-soft/5 backdrop-blur-3xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
                    >
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0">
                                        <AlertCircle className="text-red-500" size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-rosewood tracking-tight truncate leading-tight">
                                            {t('common.delete') || 'Delete Booking'}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-ivory rounded-full transition-all text-rosewood/40 hover:text-rosewood hover:rotate-90 duration-300 ml-4"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <p className="text-sm text-slate-600">Are you sure you want to delete this booking? This action cannot be undone.</p>
                                {booking && (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <p className="text-xs font-bold text-red-800">{booking.eventTitleEn}</p>
                                        <p className="text-[10px] text-red-600">{booking.eventId}</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-t border-gold/10 shrink-0">
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-50"
                                    >
                                        {t('common.cancel') || 'Cancel'}
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                                    >
                                        {t('common.confirm') || 'Confirm Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
