import React from 'react';
import { FileText, Calendar, Phone, Package, CreditCard, Mail, Hash, Wallet, RotateCcw, Receipt, BadgeCheck } from 'lucide-react';
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
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rosewood/40">
        {icon}
        {label}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`space-y-0.5 ${className}`}>
        <p className="text-[10px] font-bold text-rosewood/40">{label}</p>
        <p className="text-sm font-bold text-rosewood/80">{value}</p>
    </div>
);

const BOOKING_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  PENDING: { en: 'Pending', ta: 'நிலுவை' },
  CONFIRMED: { en: 'Confirmed', ta: 'உறுதிப்படுத்தப்பட்டது' },
  IN_PROGRESS: { en: 'Event In Progress', ta: 'நிகழ்வு நடைபெறுகிறது' },
  SETTLEMENT_PENDING: { en: 'Settlement Pending', ta: 'தீர்வு நிலுவை' },
  COMPLETED: { en: 'Completed', ta: 'முடிக்கப்பட்டது' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
};

const getStatusLabel = (status: string, t: any, language?: string): string => {
  const label = BOOKING_STATUS_LABELS[status];
  if (label) return language === 'ta' ? label.ta : label.en;
  const key = 'status' + status.toLowerCase().replace(/_([a-z])/g, (_, l) => l.toUpperCase()).replace(/_/g, '');
  return t(`adminMandapam.bookings.${key}`) || status.replace(/_/g, ' ');
};

export const ViewBookingModal: React.FC<ViewBookingModalProps> = ({ isOpen, booking, onClose, t }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    if (!booking) return null;

    const paymentStatus = getComputedPaymentStatus(booking);
    const charges = booking.totalCharges ?? (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const payments = booking.totalPayments ?? (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const refunds = booking.totalRefunds ?? (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
    const outstanding = booking.outstandingAmount ?? (charges - payments + refunds);
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
                    className="w-full py-4 bg-gradient-to-r from-rosewood to-dark-rosewood text-ivory font-bold rounded-xl hover:shadow-xl transition-all text-xs shadow-lg shadow-rosewood/20 active:scale-[0.97]"
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
                        <h4 className="text-xl md:text-2xl font-black text-rosewood leading-tight">
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
                    <span className={`px-4 py-1.5 text-[10px] font-bold rounded-full shadow-sm ring-1 ring-white/20 shrink-0 ${getBookingStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status, t, language)}
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
                            const labels: Record<string, { en: string; ta: string }> = {
                                MARRIAGE: { en: 'Marriage', ta: 'திருமணம்' },
                                RECEPTION: { en: 'Reception', ta: 'வரவேற்பு' },
                                ENGAGEMENT: { en: 'Engagement', ta: 'நிச்சயதார்த்தம்' },
                                BIRTHDAY: { en: 'Birthday', ta: 'பிறந்தநாள்' },
                                BABY_SHOWER: { en: 'Baby Shower', ta: 'பேபி ஷவர்' },
                                EAR_PIERCING: { en: 'Ear Piercing', ta: 'காது குத்தல்' },
                                PUBERTY_FUNCTION: { en: 'Puberty Function', ta: 'பூப்புநிகழ்வு' },
                                OTHER: { en: 'Other', ta: 'மற்றவை' },
                            };
                            const label = labels[booking.eventType];
                            return label ? (isTamil ? label.ta : label.en) : booking.eventType.replace(/_/g, ' ');
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
                                <h5 className="text-base font-black text-rosewood">
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
                                <p className="text-[10px] font-bold text-rosewood/40">{t('adminMandapam.bookings.bookingTotal') || 'Package Fee'}</p>
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
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full shadow-sm ring-1 ring-white/20 ${getPaymentStatusColor(paymentStatus)}`}>
                            {paymentStatus === 'not_paid' ? (t('adminMandapam.bookings.notPaid') || 'Not Paid') : paymentStatus === 'advance' ? (t('adminMandapam.bookings.advance') || 'Advance') : (t('adminMandapam.bookings.fullyPaid') || 'Fully Paid')}
                        </span>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-bold text-rosewood/60">{t('adminMandapam.bookings.totalCharges') || 'Total'}: {formatCurrency(charges)}</span>
                            <span className="font-bold text-emerald-700">{t('adminMandapam.bookings.paidToDate') || 'Paid'}: {formatCurrency(payments)}</span>
                            <span className={`font-bold ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{t('adminMandapam.bookings.outstanding') || 'Due'}: {formatCurrency(outstanding)}</span>
                        </div>
                        <div className="h-2.5 bg-gold/10 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500 transition-all" style={{width: `${charges > 0 ? (payments / charges) * 100 : 0}%`}} />
                            <div className="h-full bg-rose-300 transition-all" style={{width: `${charges > 0 ? (outstanding / charges) * 100 : 0}%`}} />
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
                                            {p.paymentType === 'ADVANCE' ? (t('adminMandapam.bookings.advanceAmount') || 'Advance') : p.paymentType === 'FINAL_PAYMENT' ? (t('adminMandapam.bookings.finalPayment') || 'Final') : p.paymentType.replace(/_/g, ' ')} · {p.paymentMethod}
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
                                            {r.refundType === 'FULL_REFUND' ? (t('adminMandapam.bookings.fullRefund') || 'Full Refund') : r.refundType === 'PARTIAL_REFUND' ? (t('adminMandapam.bookings.partialRefund') || 'Partial') : String(r.refundType).replace(/_/g, ' ')} · {r.refundMethod} {r.reason && `· ${r.reason}`}
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
