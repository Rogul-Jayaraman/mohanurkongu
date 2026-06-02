import React from 'react';
import { FileText, Calendar, User, Phone, Package, CreditCard, Clock, Mail, Hash, Wallet, RotateCcw, Receipt, BadgeCheck } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import type { Booking } from '@/types/mandapam';
import { getBookingStatusColor, getComputedPaymentStatus, getPaymentStatusColor } from '@/constants/admin/statusColors';
import { format } from 'date-fns';
import { ta } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

interface ViewBookingModalProps {
    isOpen: boolean;
    booking: Booking | null;
    onClose: () => void;
    t: any;
}

const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex items-center gap-1.5 text-[10px] font-black text-rosewood/30 uppercase tracking-widest">
        {icon}
        {label}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`space-y-0.5 ${className}`}>
        <p className="text-[10px] font-bold text-rosewood/40 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-rosewood/80">{value}</p>
    </div>
);

export const ViewBookingModal: React.FC<ViewBookingModalProps> = ({ isOpen, booking, onClose, t }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    if (!booking) return null;

    const paymentStatus = getComputedPaymentStatus(booking);
    const charges = (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const payments = (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const refunds = (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const outstanding = charges - payments + refunds;
    const isToken = booking.bookingMethod === 'TOKEN_BOOKING';

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
                    className="w-full py-4 bg-gradient-to-r from-rosewood to-dark-rosewood text-ivory font-black rounded-xl hover:shadow-xl transition-all text-xs uppercase tracking-[0.2em] shadow-lg shadow-rosewood/20 active:scale-[0.98]"
                >
                    {t('common.close') || 'Done / Close'}
                </button>
            }
        >
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-gold/10">
                    <div className="space-y-1.5 w-full sm:w-auto">
                        <SectionLabel icon={<Calendar size={12} />} label={t('adminMandapam.bookings.eventName') || 'Event Title'} />
                        <h4 className="text-xl md:text-2xl font-black text-rosewood tracking-tight leading-tight">
                            {isTamil ? booking.eventTitle.ta : booking.eventTitle.en}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[11px] font-bold text-rosewood/60 px-3 py-1 bg-ivory rounded-lg border border-gold/10 flex items-center gap-1.5">
                                <Calendar size={12} />
                                {format(new Date(booking.bookingConfig.startDate), 'dd MMM yyyy', { locale: isTamil ? ta : undefined })}
                                {booking.bookingConfig.endDate && booking.bookingConfig.endDate !== booking.bookingConfig.startDate && (
                                    <> – {format(new Date(booking.bookingConfig.endDate), 'dd MMM yyyy', { locale: isTamil ? ta : undefined })}</>
                                )}
                            </span>
                            <span className="text-[11px] font-bold text-rosewood/40 px-3 py-1 bg-ivory border border-gold/10 rounded-lg flex items-center gap-1">
                                <Hash size={10} />
                                {booking.bookingNo}
                            </span>
                            {isToken && (
                                <span className="text-[11px] font-bold text-emerald-700 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                                    <BadgeCheck size={12} />
                                    {isTamil ? 'டோக்கன்' : 'Token'}
                                </span>
                            )}
                        </div>
                    </div>
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ring-1 ring-white/20 shrink-0 ${getBookingStatusColor(booking.status)}`}>
                        {booking.status.replace(/_/g, ' ')}
                    </span>
                </div>

                {/* Customer & Event Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    <InfoRow
                        label={t('adminMandapam.bookings.userName') || 'Client Name'}
                        value={
                            <span>
                                {isTamil ? booking.customerName.ta : booking.customerName.en}
                                <span className="block text-[11px] font-medium text-rosewood/40 italic mt-0.5">
                                    {isTamil ? booking.customerName.en : booking.customerName.ta}
                                </span>
                            </span>
                        }
                    />
                    <InfoRow
                        label={t('adminMandapam.bookings.phone') || 'Contact Phone'}
                        value={
                            <span className="flex items-center gap-1.5 flex-wrap">
                                <Phone size={12} className="text-rosewood/40" />
                                {booking.customerPhone}
                                {booking.customerEmail && (
                                    <span className="text-[10px] text-rosewood/40 font-medium flex items-center gap-1">
                                        <Mail size={10} />
                                        {booking.customerEmail}
                                    </span>
                                )}
                            </span>
                        }
                    />
                    <InfoRow
                        label={t('adminMandapam.bookings.bookingMethod') || 'Booking Method'}
                        value={
                            <span className="flex items-center gap-1.5">
                                {isToken ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                        <BadgeCheck size={12} />
                                        {isTamil ? 'டோக்கன் முன்பதிவு' : 'Token Booking'}
                                    </span>
                                ) : (
                                    isTamil ? 'நேரடி முன்பதிவு' : 'Normal Booking'
                                )}
                            </span>
                        }
                    />
                    <InfoRow
                        label={t('adminMandapam.bookings.eventType') || 'Event Type'}
                        value={(() => {
                            const et = booking.eventType?.replace(/_/g, ' ');
                            if (isTamil) {
                                const map: Record<string, string> = {
                                    'MARRIAGE': 'திருமணம்', 'RECEPTION': 'வரவேற்பு', 'ENGAGEMENT': 'நிச்சயதார்த்தம்',
                                    'BIRTHDAY': 'பிறந்தநாள்', 'BABY SHOWER': 'பேபி ஷவர்', 'EAR PIERCING': 'காது குத்தல்',
                                    'PUBERTY FUNCTION': 'பூப்புநிகழ்வு', 'OTHER': 'மற்றவை'
                                };
                                return map[booking.eventType] || et;
                            }
                            return et;
                        })()}
                    />
                    {booking.bookingConfig.startTime && (
                        <InfoRow
                            label={t('adminMandapam.bookings.eventTime') || 'Event Time'}
                            value={`${booking.bookingConfig.startTime}${booking.bookingConfig.endTime ? ` - ${booking.bookingConfig.endTime}` : ''}`}
                        />
                    )}
                    {isToken && booking.tokenEntries?.length > 0 && (
                        <InfoRow
                            label={isTamil ? 'டோக்கன்கள்' : 'Token Count'}
                            value={String(booking.tokenEntries.reduce((s, te) => s + te.tokens, 0))}
                        />
                    )}
                </div>

                {/* Package & Addons Card */}
                <div className="bg-gradient-to-br from-ivory/80 to-white rounded-2xl p-5 border border-gold/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <Package size={80} />
                    </div>
                    <div className="relative z-10">
                        <SectionLabel icon={<Package size={12} />} label={t('adminMandapam.bookings.package') || 'Package'} />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2">
                            <div>
                                <h5 className="text-base font-black text-rosewood uppercase tracking-tight">
                                    {isTamil ? booking.packageSnapshot?.packageName?.ta : booking.packageSnapshot?.packageName?.en}
                                </h5>
                                <p className="text-xs font-medium text-rosewood/50 mt-0.5 flex items-center gap-2">
                                    {booking.packageCode}
                                    {isToken && (
                                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                            {isTamil ? 'டோக்கனால் மூடப்பட்டது' : 'Token Covered'}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="text-left md:text-right">
                                <p className="text-[10px] font-bold text-rosewood/40 uppercase">{t('adminMandapam.bookings.bookingTotal') || 'Package Fee'}</p>
                                <p className="text-xl font-black text-rosewood">{formatCurrency(booking.packageSnapshot?.packagePrice || 0)}</p>
                            </div>
                        </div>
                        {(booking.addonSnapshots?.length ?? 0) > 0 && (
                            <div className="mt-4 pt-4 border-t border-gold/10 space-y-1.5">
                                <SectionLabel icon={<Receipt size={12} />} label={t('adminMandapam.bookings.addons') || 'Add-ons'} />
                                {booking.addonSnapshots.map(a => {
                                    const qty = a.quantity ?? 1;
                                    const units = a.units ?? 1;
                                    const total = a.amount * qty * units;
                                    const label = a.units
                                        ? `${isTamil ? a.addonName.ta : a.addonName.en} × ${qty} × ${units}${a.pricingType === 'PER_HOUR' ? 'h' : 'd'}`
                                        : `${isTamil ? a.addonName.ta : a.addonName.en} × ${qty}`;
                                    return (
                                        <div key={a.id} className="flex justify-between text-xs">
                                            <span className="font-bold text-rosewood/70">{label}</span>
                                            <span className="font-black text-rosewood">{formatCurrency(total)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Lifecycle */}
                <div className="bg-gradient-to-br from-rosewood/[0.02] to-rosewood/[0.01] rounded-2xl p-5 border border-rosewood/10">
                    <div className="flex items-center justify-between mb-4">
                        <SectionLabel icon={<CreditCard size={12} />} label={t('adminMandapam.bookings.paymentStatus') || 'Payment Lifecycle'} />
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] rounded-full shadow-sm ring-1 ring-white/20 ${getPaymentStatusColor(paymentStatus)}`}>
                            {paymentStatus.replace(/_/g, ' ')}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="p-3.5 bg-white/80 rounded-xl border border-gold/5">
                            <p className="text-[9px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.totalCharges') || 'Total Charges'}</p>
                            <p className="text-base font-black text-rosewood">{formatCurrency(charges)}</p>
                        </div>
                        <div className="p-3.5 bg-white/80 rounded-xl border border-gold/5">
                            <p className="text-[9px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.paidToDate') || 'Paid to Date'}</p>
                            <p className="text-base font-black text-emerald-700">{formatCurrency(payments)}</p>
                        </div>
                        <div className="p-3.5 bg-white/80 rounded-xl border border-gold/5">
                            <p className="text-[9px] font-bold text-rosewood/40 uppercase mb-1">{t('adminMandapam.bookings.outstanding') || 'Outstanding'}</p>
                            <p className={`text-base font-black ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatCurrency(outstanding)}
                            </p>
                        </div>
                    </div>

                    {(booking.paymentEntries?.length ?? 0) > 0 && (
                        <div className="mb-3">
                            <SectionLabel icon={<Wallet size={12} />} label={t('adminMandapam.bookings.payments') || 'Payments'} />
                            <div className="space-y-1.5 mt-2">
                                {booking.paymentEntries.map(p => (
                                    <div key={p.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-xs p-2.5 bg-white/60 rounded-lg border border-gold/5">
                                        <span className="font-bold text-rosewood/60 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                            {p.paymentType.replace(/_/g, ' ')} · {p.paymentMethod} {p.referenceNo && `· ${p.referenceNo}`}
                                        </span>
                                        <span className="font-black text-emerald-700">{formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(booking.refundEntries?.length ?? 0) > 0 && (
                        <div>
                            <SectionLabel icon={<RotateCcw size={12} />} label={t('adminMandapam.bookings.refunds') || 'Refunds'} />
                            <div className="space-y-1.5 mt-2">
                                {booking.refundEntries.map(r => (
                                    <div key={r.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-xs p-2.5 bg-white/60 rounded-lg border border-gold/5">
                                        <span className="font-bold text-rosewood/60 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                                            {r.refundType.replace(/_/g, ' ')} · {r.refundMethod} {r.reason && `· ${r.reason}`}
                                        </span>
                                        <span className="font-black text-rose-700">-{formatCurrency(r.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalShell>
    );
};
