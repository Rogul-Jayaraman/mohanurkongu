import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, User, Phone, Package, CreditCard, X } from 'lucide-react';
import type { MandapamBooking } from '@/services/mandapamService';
import { getBookingStatusColor, getPaymentStatusColor } from '@/constants/admin/statusColors';
import { format } from 'date-fns';
import { ta } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';
import { scrollToTop } from '@/components/ui/layout/ScrollToTop';

interface ViewDetailsModalProps {
    isOpen: boolean;
    booking: MandapamBooking | null;
    onClose: () => void;
    t: any;
}

export const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ isOpen, booking, onClose, t }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            scrollToTop();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!booking) return null;

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
                        className="relative w-full max-w-lg bg-gold-soft/5 backdrop-blur-3xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
                    >
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0">
                                        <FileText size={24} className="text-rosewood" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-rosewood tracking-tight truncate leading-tight">
                                            {t('adminMandapam.bookings.bookingDetails') || 'Booking Details'}
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
                                <div className="space-y-8">
                                    <div className="flex justify-between items-start pb-6 border-b border-gold/10">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-[0.2em]">{t('adminMandapam.bookings.eventName') || 'EVENT TITLE'}</p>
                                            <h4 className="text-2xl font-black text-rosewood tracking-tighter leading-tight">{booking.eventTitleEn}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[11px] font-bold text-rosewood/60 px-2.5 py-1 bg-gold/10 rounded-lg flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    {format(new Date(booking.date), 'dd MMMM yyyy', { locale: isTamil ? ta : undefined })}
                                                </span>
                                                <span className="text-[11px] font-bold text-rosewood/40 uppercase tracking-widest px-2.5 py-1 bg-ivory border border-gold/10 rounded-lg">
                                                    {booking.session.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ring-1 ring-white/20 ${getBookingStatusColor((booking.status || 'UPCOMING').toLowerCase() as any)}`}>
                                            {booking.status || 'UPCOMING'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-rosewood/30 uppercase tracking-widest">
                                                <User size={12} />
                                                {t('adminMandapam.bookings.userName') || 'CLIENT NAME'}
                                            </div>
                                            <p className="text-sm font-black text-rosewood/80">{booking.contactNameEn}</p>
                                            <p className="text-[11px] font-bold text-rosewood/40 italic">{booking.contactNameTa}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-rosewood/30 uppercase tracking-widest">
                                                <Phone size={12} />
                                                {t('adminMandapam.bookings.phone') || 'CONTACT PHONE'}
                                            </div>
                                            <p className="text-sm font-black text-rosewood/80">{booking.phone}</p>
                                            <p className="text-[11px] font-bold text-rosewood/40">{booking.email || t('adminMandapam.bookings.noEmail') || 'No email provided'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-ivory/50 p-6 rounded-4xl border border-gold/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                            <Package size={80} />
                                        </div>
                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{t('adminMandapam.bookings.package') || 'PLAN & PACKAGE'}</p>
                                                <h5 className="text-lg font-black text-rosewood uppercase tracking-tight">{booking.packageNameEn}</h5>
                                                <p className="text-xs font-medium text-rosewood/60 max-w-xs leading-relaxed italic line-clamp-2 md:line-clamp-none">
                                                    {t('adminMandapam.bookings.packageIncludes') || 'Includes all standard venue amenities and session specific services.'}
                                                </p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">Total Fee</p>
                                                <p className="text-2xl font-black text-rosewood">₹{booking.packageSnapshotPrice.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-rosewood/5 p-6 rounded-4xl border border-rosewood/10">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-rosewood/40 uppercase tracking-[0.15em]">
                                                <CreditCard size={14} />
                                                {t('adminMandapam.bookings.paymentStatus') || 'PAYMENT LIFECYCLE'}
                                            </div>
                                            {(() => {
                                                const statusMap: Record<string, any> = {
                                                    'FULLY_PAID': 'approved',
                                                    'ADVANCE': 'pending',
                                                    'NOT_PAID': 'rejected'
                                                };
                                                return (
                                                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-full shadow-sm ring-1 ring-white/20 ${getPaymentStatusColor(statusMap[booking.paymentStatus])}`}>
                                                        {booking.paymentStatus.replace('_', ' ')}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/60 rounded-xl border border-gold/5">
                                                <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.paidToDate') || 'Paid to Date'}</p>
                                                <p className="text-lg font-black text-emerald-700">₹{booking.paidAmount.toLocaleString()}</p>
                                            </div>
                                            <div className="p-4 bg-white/60 rounded-xl border border-gold/5">
                                                <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.balanceDue') || 'Balance Due'}</p>
                                                <p className="text-lg font-black text-rose-700">₹{(booking.packageSnapshotPrice - booking.paidAmount).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-t border-gold/10 shrink-0">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-rosewood text-ivory font-black rounded-xl hover:shadow-xl transition-all text-xs uppercase tracking-[0.2em] shadow-lg shadow-rosewood/20 active:scale-[0.98]"
                                >
                                    {t('common.close') || 'Done / Close'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
