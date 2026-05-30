import React from 'react';
import { FileText, Calendar, User, Phone, Package as PackageIcon, CreditCard, Clock, ArrowRight, Receipt, Wallet, RotateCcw } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import type { Booking } from '@/types/mandapam';
import { getBookingStatusColor, getComputedPaymentStatus, getPaymentStatusColor } from '@/constants/admin/statusColors';
import { format } from 'date-fns';
import { ta } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

interface ViewDetailsModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
}

export const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ isOpen, booking, onClose, t }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    if (!booking) return null;

    const paymentStatus = getComputedPaymentStatus(booking);
    const charges = (booking.ledgerEntries || []).reduce((s, e) => s + e.amount, 0);
    const payments = (booking.paymentEntries || []).reduce((s, e) => s + e.amount, 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + e.amount, 0);
    const outstanding = charges - payments + refunds;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            icon={<FileText size={24} className="text-rosewood" />}
            title={t('adminMandapam.bookings.bookingDetails') || 'Booking Details'}
            size="lg"
            footer={
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-rosewood text-ivory font-black rounded-xl hover:shadow-xl transition-all text-xs uppercase tracking-[0.2em] shadow-lg shadow-rosewood/20 active:scale-[0.98]"
                >
                    {t('common.close') || 'Done / Close'}
                </button>
            }
        >
            <div className="space-y-8">
                <div className="flex justify-between items-start pb-6 border-b border-gold/10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-[0.2em]">{t('adminMandapam.bookings.eventName') || 'EVENT TITLE'}</p>
                        <h4 className="text-2xl font-black text-rosewood tracking-tighter leading-tight">
                            {isTamil ? booking.eventTitle.ta : booking.eventTitle.en}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[11px] font-bold text-rosewood/60 px-2.5 py-1 bg-gold/10 rounded-lg flex items-center gap-1.5">
                                <Calendar size={12} />
                                {format(new Date(booking.bookingConfig.startDate), 'dd MMMM yyyy', { locale: isTamil ? ta : undefined })}
                                {booking.bookingConfig.endDate !== booking.bookingConfig.startDate && (
                                    <> – {format(new Date(booking.bookingConfig.endDate), 'dd MMMM yyyy', { locale: isTamil ? ta : undefined })}</>
                                )}
                            </span>
                            <span className="text-[11px] font-bold text-rosewood/40 uppercase tracking-widest px-2.5 py-1 bg-ivory border border-gold/10 rounded-lg">
                                {booking.packageCode} · {booking.bookingNo}
                            </span>
                        </div>
                    </div>
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ring-1 ring-white/20 ${getBookingStatusColor(booking.status)}`}>
                        {booking.status.replace(/_/g, ' ')}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-rosewood/30 uppercase tracking-widest">
                            <User size={12} />
                            {t('adminMandapam.bookings.userName') || 'CLIENT NAME'}
                        </div>
                        <p className="text-sm font-black text-rosewood/80">{isTamil ? booking.customerName.ta : booking.customerName.en}</p>
                        <p className="text-[11px] font-bold text-rosewood/40 italic">{isTamil ? booking.customerName.en : booking.customerName.ta}</p>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-rosewood/30 uppercase tracking-widest">
                            <Phone size={12} />
                            {t('adminMandapam.bookings.phone') || 'CONTACT PHONE'}
                        </div>
                        <p className="text-sm font-black text-rosewood/80">{booking.customerPhone}</p>
                        <p className="text-[11px] font-bold text-rosewood/40">{booking.customerEmail || t('adminMandapam.bookings.noEmail') || 'No email provided'}</p>
                    </div>
                </div>
                <div className="bg-ivory/50 p-6 rounded-4xl border border-gold/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <PackageIcon size={80} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{t('adminMandapam.bookings.package') || 'PLAN & PACKAGE'}</p>
                            <h5 className="text-lg font-black text-rosewood uppercase tracking-tight">
                                {isTamil ? booking.packageSnapshot?.packageName?.ta : booking.packageSnapshot?.packageName?.en}
                            </h5>
                            <p className="text-xs font-medium text-rosewood/60">{t('adminMandapam.bookings.bookingMethod') || 'Method'}: {booking.bookingMethod.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.bookingTotal') || 'Package Fee'}</p>
                            <p className="text-2xl font-black text-rosewood">{formatCurrency(booking.packageSnapshot?.packagePrice || 0)}</p>
                        </div>
                    </div>
                    {booking.addonSnapshots.length > 0 && (
                        <div className="relative z-10 mt-4 pt-4 border-t border-gold/10 space-y-1.5">
                            <p className="text-[10px] font-black text-rosewood/30 uppercase tracking-widest">{t('adminMandapam.bookings.addons') || 'ADD-ONS'}</p>
                            {booking.addonSnapshots.map(a => (
                                <div key={a.id} className="flex justify-between text-xs text-rosewood/70">
                                    <span className="font-bold">{isTamil ? a.addonName.ta : a.addonName.en} × {a.quantity}</span>
                                    <span className="font-black">{formatCurrency(a.amount * a.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-rosewood/5 p-6 rounded-4xl border border-rosewood/10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-rosewood/40 uppercase tracking-[0.15em]">
                            <CreditCard size={14} />
                            {t('adminMandapam.bookings.paymentStatus') || 'PAYMENT LIFECYCLE'}
                        </div>
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-full shadow-sm ring-1 ring-white/20 ${getPaymentStatusColor(paymentStatus)}`}>
                            {paymentStatus.replace(/_/g, ' ')}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-white/60 rounded-xl border border-gold/5">
                            <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.totalCharges') || 'Total Charges'}</p>
                            <p className="text-lg font-black text-rosewood">{formatCurrency(charges)}</p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-xl border border-gold/5">
                            <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.paidToDate') || 'Paid to Date'}</p>
                            <p className="text-lg font-black text-emerald-700">{formatCurrency(payments)}</p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-xl border border-gold/5">
                            <p className="text-[10px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.outstanding') || 'Outstanding'}</p>
                            <p className={`text-lg font-black ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatCurrency(outstanding)}
                            </p>
                        </div>
                    </div>

                    {booking.paymentEntries.length > 0 && (
                        <div className="mb-4">
                            <p className="text-[10px] font-black text-rosewood/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Wallet size={12} /> {t('adminMandapam.bookings.payments') || 'PAYMENTS'}
                            </p>
                            <div className="space-y-1">
                                {booking.paymentEntries.map(p => (
                                    <div key={p.id} className="flex justify-between text-xs p-2 bg-white/40 rounded-lg">
                                        <span className="font-bold text-rosewood/60">
                                            {p.paymentType.replace(/_/g, ' ')} · {p.paymentMethod} {p.referenceNo ? `· ${p.referenceNo}` : ''}
                                        </span>
                                        <span className="font-black text-emerald-700">{formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {booking.refundEntries.length > 0 && (
                        <div className="mb-4">
                            <p className="text-[10px] font-black text-rosewood/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <RotateCcw size={12} /> {t('adminMandapam.bookings.refunds') || 'REFUNDS'}
                            </p>
                            <div className="space-y-1">
                                {booking.refundEntries.map(r => (
                                    <div key={r.id} className="flex justify-between text-xs p-2 bg-white/40 rounded-lg">
                                        <span className="font-bold text-rosewood/60">
                                            {r.refundType.replace(/_/g, ' ')} · {r.refundMethod} {r.reason ? `· ${r.reason}` : ''}
                                        </span>
                                        <span className="font-black text-rose-700">-{formatCurrency(r.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {booking.timeline.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-rosewood/30 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Clock size={12} /> {t('adminMandapam.bookings.timeline') || 'TIMELINE'}
                        </p>
                        <div className="space-y-2">
                            {booking.timeline.map(entry => (
                                <div key={entry.id} className="flex items-start gap-3 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                                    <div className="flex-1 flex justify-between">
                                        <span className="font-bold text-rosewood/70">{entry.event.replace(/_/g, ' ')}</span>
                                        <span className="text-rosewood/40 font-medium">{format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};