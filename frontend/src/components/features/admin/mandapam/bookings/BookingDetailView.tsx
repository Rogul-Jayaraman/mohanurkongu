import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, FileText, User,
  Package, Receipt, CreditCard,
  Shield, History, CheckCircle,
  XCircle, Flag, Printer, Loader2, Gavel, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ta } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';
import { useBooking } from '@/queries/useMandapamQueries';
import { useBookingWrite } from '@/queries/useMandapamMutations';
import { SectionCard3D, SectionHeaderRedesigned, DetailRow, SectionDivider } from '@/components/features/matrimony/ProfileViewPrimitives';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { CompleteBookingModal } from '@/components/modals/admin/CompleteBookingModal';
import { AddChargeModal } from '@/components/modals/admin/AddChargeModal';
import { CancelRefundModal } from '@/components/modals/admin/CancelRefundModal';
import { BookingInvoiceModal } from './BookingInvoiceModal';
import BookingInvoicePrint from './BookingInvoicePrint';
import { getBookingStatusStyle } from '@/constants/admin/statusColors';
import { formatCurrency } from '@/utils/format';
import type { Booking, BookingStatus } from '@/types/mandapam';

const EVENT_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  MARRIAGE: { en: 'Marriage', ta: 'திருமணம்' },
  RECEPTION: { en: 'Reception', ta: 'வரவேற்பு' },
  ENGAGEMENT: { en: 'Engagement', ta: 'நிச்சயதார்த்தம்' },
  BIRTHDAY: { en: 'Birthday', ta: 'பிறந்தநாள்' },
  BABY_SHOWER: { en: 'Baby Shower', ta: 'பேபி ஷவர்' },
  EAR_PIERCING: { en: 'Ear Piercing', ta: 'காது குத்தல்' },
  PUBERTY_FUNCTION: { en: 'Puberty Function', ta: 'பூப்புநிகழ்வு' },
  OTHER: { en: 'Other', ta: 'மற்றவை' },
};

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
  return t(`adminMandapam.bookings.${key}`) || status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const TIMELINE_EVENT_LABELS: Record<string, { en: string; ta: string }> = {
  TOKEN_CONSUMED: { en: 'Token Consumed', ta: 'டோக்கன் பயன்படுத்தப்பட்டது' },
  TOKEN_ISSUED: { en: 'Token Issued', ta: 'டோக்கன் வழங்கப்பட்டது' },
  TOKEN_REVERSED: { en: 'Token Reversed', ta: 'டோக்கன் திரும்பப் பெறப்பட்டது' },
  PAYMENT_ADDED: { en: 'Payment Added', ta: 'கட்டணம் சேர்க்கப்பட்டது' },
  PAYMENT_RECEIVED: { en: 'Payment Received', ta: 'கட்டணம் பெறப்பட்டது' },
  BOOKING_CREATED: { en: 'Booking Created', ta: 'முன்பதிவு உருவாக்கப்பட்டது' },
};

const getTimelineEventLabel = (event: string, isTamil: boolean): string => {
  const label = TIMELINE_EVENT_LABELS[event];
  return label
    ? (isTamil ? label.ta : label.en)
    : event.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getLedgerLabel = (entry: any, isTamil: boolean): string => {
  const desc = entry.description
    ? (isTamil ? entry.description.ta || entry.description.en : entry.description.en || entry.description.ta)
    : '';
  switch (entry.source) {
    case 'PACKAGE': return isTamil ? 'தொகுப்பு கட்டணம்' : 'Package Fee';
    case 'ADDON': return desc || (isTamil ? 'சேர்க்கை' : 'Add-on');
    case 'DAMAGE': return `${isTamil ? 'சேதம்' : 'Damage'}${desc ? `: ${desc}` : ''}`;
    case 'PENALTY': return `${isTamil ? 'அபராதம்' : 'Penalty'}${desc ? `: ${desc}` : ''}`;
    case 'SERVICE': return `${isTamil ? 'கூடுதல்' : 'Extra'}${desc ? `: ${desc}` : ''}`;
    case 'DISCOUNT': return isTamil ? 'தள்ளுபடி' : 'Discount';
    case 'ADJUSTMENT': return desc || (isTamil ? 'சரிசெய்தல்' : 'Adjustment');
    default: return desc || entry.source;
  }
};

const TIMELINE_STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'text-sky-600 bg-sky-50 border-sky-200',
  IN_PROGRESS: 'text-blue-600 bg-blue-50 border-blue-200',
  SETTLEMENT_PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  COMPLETED: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  CANCELLED: 'text-rose-600 bg-rose-50 border-rose-200',
};

const btnBase =
  'rounded-xl font-semibold text-sm px-4 py-2.5 sm:py-3 flex items-center justify-center gap-2 ' +
  'hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-sm';

const ACTION_VISIBILITY: Record<BookingStatus, { endEvent: boolean; complete: boolean; cancel: boolean }> = {
  CONFIRMED: { endEvent: false, complete: false, cancel: true },
  IN_PROGRESS: { endEvent: true, complete: false, cancel: false },
  SETTLEMENT_PENDING: { endEvent: false, complete: true, cancel: false },
  COMPLETED: { endEvent: false, complete: false, cancel: false },
  CANCELLED: { endEvent: false, complete: false, cancel: false },
};

const PRICING_LABELS: Record<string, { en: string; ta: string }> = {
  PER_EVENT: { en: 'Per Event', ta: 'ஒரு நிகழ்வுக்கு' },
  PER_HOUR: { en: 'Per Hour', ta: 'மணி நேரத்திற்கு' },
  PER_DAY: { en: 'Per Day', ta: 'ஒரு நாளுக்கு' },
};

const PAYMENT_METHOD_KEYS: Record<string, string> = {
  CASH: 'cash',
  UPI: 'upi',
  BANK_TRANSFER: 'bankTransfer',
  CHEQUE: 'cheque',
  CARD: 'card',
  OTHER: 'other',
};

const CHARGE_TYPE_KEYS: Record<string, string> = {
  damage: 'chargeDamage',
  penalty: 'chargePenalty',
  extra: 'chargeExtra',
};

const PAYMENT_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  ADVANCE: { en: 'Advance', ta: 'முன்பணம்' },
  INSTALLMENT: { en: 'Installment', ta: 'தவணை' },
  FINAL_PAYMENT: { en: 'Final Payment', ta: 'இறுதி கட்டணம்' },
};

const REFUND_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  FULL_REFUND: { en: 'Full Refund', ta: 'முழு பணத்திரும்பு' },
  PARTIAL_REFUND: { en: 'Partial Refund', ta: 'பகுதி பணத்திரும்பு' },
};

const SETTLEMENT_STATE_LABELS: Record<string, { en: string; ta: string }> = {
  PENDING: { en: 'Pending', ta: 'நிலுவை' },
  IN_PROGRESS: { en: 'In Progress', ta: 'நடைபெறுகிறது' },
  COMPLETED: { en: 'Completed', ta: 'முடிக்கப்பட்டது' },
};

type ActiveModal = 'complete' | 'cancel' | 'end-event' | 'invoice' | 'timeline' | 'add-charge' | null;

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-[1500px] mx-auto p-6">
    <div className="h-8 w-48 skeleton" />
    <div className="h-40 skeleton rounded-xl" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-48 skeleton rounded-xl" />
      <div className="h-48 skeleton rounded-xl" />
    </div>
    <div className="h-36 skeleton rounded-xl" />
    <div className="h-48 skeleton rounded-xl" />
    <div className="h-32 skeleton rounded-xl" />
    <div className="h-40 skeleton rounded-xl" />
  </div>
);

const BookingDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isTamil = language === 'ta';

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);

  const { data, isPending, error } = useBooking(id);
  const bookingWrite = useBookingWrite();

  const responseData = data as { booking: Booking } | undefined;
  const booking = responseData?.booking ?? null;
  const loading = isPending || (!data && !error);

  React.useEffect(() => {
    if (isPrintingInvoice && booking) {
      document.body.classList.add('printing-invoice');
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintingInvoice, booking]);

  React.useEffect(() => {
    if (isPrintingInvoice) {
      const handler = () => {
        setIsPrintingInvoice(false);
        document.body.classList.remove('printing-invoice');
      };
      window.addEventListener('afterprint', handler);
      return () => window.removeEventListener('afterprint', handler);
    }
  }, [isPrintingInvoice]);

  if (loading) return <LoadingSkeleton />;

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-500">
            {t('common.notFound') || 'Booking not found'}
          </p>
          <button onClick={() => navigate('/admin/mandapam/bookings')} className="mt-4 px-6 py-2.5 bg-rosewood-gradient text-ivory rounded-xl font-semibold text-xs">
            {t('adminMandapam.bookings.backToBookings') || 'Back to Bookings'}
          </button>
        </div>
      </div>
    );
  }

  const isToken = booking.bookingMethod === 'TOKEN_BOOKING';
  const consumedTokens = (booking.tokens || []).filter(t => t.status === 'USED');
  const tokenNumbersStr = consumedTokens.map(t => t.tokenId).join(', ');

  const totalCharges = booking.totalCharges ?? (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  const totalPayments = booking.totalPayments ?? (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  const totalRefunds = booking.totalRefunds ?? (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  const outstanding = booking.outstandingAmount ?? (totalCharges - totalPayments + totalRefunds);
  const chargeEntries = (booking.ledgerEntries || []).filter(e => ['DAMAGE', 'PENALTY', 'SERVICE'].includes(e.source));

  const discountTotal = (booking.ledgerEntries || [])
    .filter(e => e.source === 'DISCOUNT')
    .reduce((s, e) => s + Math.abs(Number(e.amount)), 0);

  const visibility = ACTION_VISIBILITY[booking.status] || ACTION_VISIBILITY.CONFIRMED;

  const openModal = (modal: ActiveModal) => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);

  const handleConfirmComplete = async (b: Booking, amount: string, paymentMethod: string) => {
    const raw = amount.replace?.(/,/g, '') ?? amount;
    const numAmount = raw ? Number(raw) : 0;
    await bookingWrite.mutateAsync({
      bookingId: b.id,
      action: { type: 'settlement', action: 'complete', finalAmount: numAmount },
    });
    if (numAmount > 0) {
      await bookingWrite.mutateAsync({
        bookingId: b.id,
        action: { type: 'add-payment', paymentType: 'FINAL_PAYMENT', paymentMethod: paymentMethod as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE', amount: numAmount },
      });
    }
    closeModal();
  };

  const handleConfirmCancel = async (b: Booking, refundType: string, refundAmount: string, refundMethod: string, reason: string) => {
    await bookingWrite.mutateAsync({
      bookingId: b.id,
      action: { type: 'update-status', status: 'CANCELLED', notes: reason },
    });
    if (refundType !== 'NO_REFUND' && refundAmount) {
      const numAmount = Number(refundAmount.replace?.(/,/g, '') ?? refundAmount);
      await bookingWrite.mutateAsync({
        bookingId: b.id,
        action: { type: 'add-refund', refundType: refundType as 'PARTIAL_REFUND' | 'FULL_REFUND', refundMethod: refundMethod as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE', amount: numAmount, reason },
      });
    }
    closeModal();
  };

  const handleRemoveCharge = async (chargeId: string) => {
    await bookingWrite.mutateAsync({
      bookingId: booking.id,
      action: { type: 'remove-charge', chargeId },
    });
  };

  const handleConfirmEndEvent = async () => {
    await bookingWrite.mutateAsync({
      bookingId: booking.id,
      action: { type: 'settlement', action: 'start' },
    });
    closeModal();
  };

  const cancelledEntry = (booking.timeline || []).find(e => e.event === 'CANCELLED');
  const cancelledAt = cancelledEntry?.createdAt || null;
  const cancelReason = cancelledEntry?.notes || null;

  if (isPrintingInvoice && booking) {
    return <BookingInvoicePrint booking={booking} isTamil={isTamil} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 max-w-[1500px] mx-auto pb-12"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-2 pb-2 gap-2">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin/mandapam/bookings')}
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-ivory-gold-gradient rounded-xl text-[10px] sm:text-xs font-semibold shadow-sm btn-shine shrink-0"
        >
          <ArrowLeft size={14} className="sm:size-4" />
          <span className="hidden sm:inline">{t('common.back') || 'Back'}</span>
        </motion.button>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-ivory border border-gold/10 text-rosewood font-semibold text-xs shadow-sm">
            {booking.bookingNo}
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm ${
            getBookingStatusStyle(booking.status).bg} ${getBookingStatusStyle(booking.status).text} ${getBookingStatusStyle(booking.status).border
          }`}>
            {getStatusLabel(booking.status, t, language)}
          </div>
          {!['COMPLETED', 'CANCELLED'].includes(booking.status) && (
            <button
              onClick={() => openModal('add-charge')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rosewood-gradient text-white rounded-lg text-[10px] font-bold hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-sm shrink-0"
            >
              <Gavel size={12} />
              {isTamil ? 'கட்டணம்' : 'Charge'}
            </button>
          )}
        </div>
      </div>

      {/* ── Customer & Event Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard3D>
          <SectionHeaderRedesigned
            title={t('adminMandapam.bookings.customerInfo') || 'Customer Info'}
            icon={<User size={16} />}
            gradient="bg-ivory-gold-gradient text-rosewood"
            isTamil={isTamil}
          />
          <div className="space-y-0">
            <DetailRow label={t('adminMandapam.bookings.name') || 'Name'} value={isTamil ? booking.customerName.ta : booking.customerName.en} />
            <DetailRow label={t('adminMandapam.bookings.phone') || 'Phone'} value={booking.customerPhone} />
            {booking.customerEmail && (
              <DetailRow label="Email" value={booking.customerEmail} />
            )}
          </div>
        </SectionCard3D>

        <SectionCard3D>
          <SectionHeaderRedesigned
            title={t('adminMandapam.bookings.eventDetails') || 'Event Details'}
            icon={<Calendar size={16} />}
            gradient="bg-ivory-gold-gradient text-rosewood"
            isTamil={isTamil}
          />
          <div className="space-y-0">
            <DetailRow label={t('adminMandapam.bookings.eventTitle') || 'Event Title'} value={isTamil ? booking.eventTitle.ta : booking.eventTitle.en} />
            <DetailRow label={t('adminMandapam.bookings.eventType') || 'Type'} value={
              isTamil
                ? (EVENT_TYPE_LABELS[booking.eventType]?.ta || booking.eventType.replace(/_/g, ' '))
                : (EVENT_TYPE_LABELS[booking.eventType]?.en || booking.eventType.replace(/_/g, ' '))
            } />
            <DetailRow label={t('adminMandapam.bookings.date') || 'Date'} value={
              `${format(new Date(booking.bookingConfig.startDate), 'EEE, dd MMM yyyy', { locale: isTamil ? ta : undefined })}${booking.bookingConfig.endDate && booking.bookingConfig.endDate !== booking.bookingConfig.startDate ? ` — ${format(new Date(booking.bookingConfig.endDate), 'EEE, dd MMM yyyy', { locale: isTamil ? ta : undefined })}` : ''}`
            } />
            {booking.bookingConfig.startTime && (
              <DetailRow label={t('adminMandapam.bookings.eventTime') || 'Time'} value={
                `${booking.bookingConfig.startTime}${booking.bookingConfig.endTime ? ` — ${booking.bookingConfig.endTime}` : ''}`
              } />
            )}
          </div>
        </SectionCard3D>
      </div>

      {/* ── Booking Details ── */}
      <SectionCard3D>
        <SectionHeaderRedesigned
          title={t('adminMandapam.bookings.bookingDetails') || 'Booking Details'}
          icon={<Receipt size={16} />}
          gradient="bg-ivory-gold-gradient text-rosewood"
          isTamil={isTamil}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-0">
            <DetailRow label={t('adminMandapam.bookings.bookingType') || 'Booking Type'} value={
              isTamil
                ? (booking.bookingType === 'HOURLY' ? 'மணிநேர முன்பதிவு' : booking.bookingType === 'ONE_DAY' ? 'ஒரு நாள் முன்பதிவு' : 'இரண்டு நாள் முன்பதிவு')
                : (booking.bookingType === 'HOURLY' ? 'Hourly Booking' : booking.bookingType === 'ONE_DAY' ? '1 Day Booking' : '2 Day Booking')
            } />
            <DetailRow label={t('adminMandapam.bookings.bookingMethod') || 'Method'} value={
              isToken ? (t('adminMandapam.bookings.tokenBooking') || 'Token Booking') : (t('adminMandapam.bookings.normalBooking') || 'Normal Booking')
            } />
            {isToken && tokenNumbersStr && (
              <DetailRow label={t('adminMandapam.bookings.tokens') || 'Tokens'} value={tokenNumbersStr} />
            )}
          </div>
          <div className="space-y-0">
            <DetailRow label={t('adminMandapam.bookings.createdAt') || 'Created at'} value={format(new Date(booking.createdAt), 'dd MMM yyyy, h:mm a', { locale: isTamil ? ta : undefined })} />
            <DetailRow label={t('adminMandapam.bookings.lastUpdated') || 'Last updated'} value={format(new Date(booking.updatedAt), 'dd MMM yyyy, h:mm a', { locale: isTamil ? ta : undefined })} />
          </div>
        </div>
      </SectionCard3D>

      {/* ── Package Details ── */}
      <SectionCard3D>
        <SectionHeaderRedesigned
          title={t('adminMandapam.bookings.packageDetails') || 'Package Details'}
          icon={<Package size={16} />}
          gradient="bg-ivory-gold-gradient text-rosewood"
          isTamil={isTamil}
        />
        <div className="overflow-hidden rounded-xl border border-gold/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-rosewood/[0.03]">
                <th className="text-left py-2.5 px-3 font-semibold text-rosewood">
                  {t('adminMandapam.bookings.description') || 'Description'}
                </th>
                <th className="text-right py-2.5 px-3 font-semibold text-rosewood">
                  {t('adminMandapam.bookings.amount') || 'Amount'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gold/5 hover:bg-gold/[0.03] transition-colors">
                <td className="py-2.5 px-3 font-semibold text-dark-brown">
                  {isTamil ? booking.packageSnapshot?.packageName?.ta : booking.packageSnapshot?.packageName?.en}
                </td>
                <td className="py-2.5 px-3 font-semibold text-dark-brown text-right">
                  {isToken ? '₹0' : formatCurrency(booking.packageSnapshot?.packagePrice || 0)}
                </td>
              </tr>
              {isToken && tokenNumbersStr && (
                <tr className="border-t border-gold/5 hover:bg-gold/[0.03] transition-colors">
                  <td colSpan={2} className="py-2.5 px-3 text-dark-brown/70">
                    {t('adminMandapam.bookings.tokensUsed') || 'Tokens used'} : {tokenNumbersStr}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard3D>

      {/* ── Add-ons ── */}
      {(booking.addonSnapshots?.length ?? 0) > 0 && (
        <SectionCard3D>
          <SectionHeaderRedesigned
            title={t('adminMandapam.bookings.addons') || 'Add-ons'}
            icon={<Receipt size={16} />}
            gradient="bg-ivory-gold-gradient text-rosewood"
            isTamil={isTamil}
          />
          <div className="overflow-hidden rounded-xl border border-gold/10">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-rosewood/[0.03]">
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.addons') || 'Add-on'}</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.pricing') || 'Pricing'}</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.rate') || 'Rate'}</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.amount') || 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.addonSnapshots.map((a, idx) => {
                    const qty = a.quantity ?? 1;
                    const units = a.units ?? 1;
                    const total = a.amount * qty * units;
                    const pricingLabel = isTamil ? PRICING_LABELS[a.pricingType].ta : PRICING_LABELS[a.pricingType].en;
                    let rateDisplay = formatCurrency(a.amount);
                    if (a.pricingType === 'PER_HOUR' && units > 0) {
                      rateDisplay += ` × ${units}${isTamil ? ' மணி' : 'h'}`;
                    } else if (a.pricingType === 'PER_DAY' && units > 0) {
                      rateDisplay += ` × ${units}${isTamil ? ' நாள்' : 'd'}`;
                    } else if (qty > 1) {
                      rateDisplay += ` × ${qty}`;
                    }
                    return (
                      <tr key={a.id} className="border-t border-gold/5 hover:bg-gold/[0.03] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-dark-brown/60">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-dark-brown">
                          {isTamil ? a.addonName.ta : a.addonName.en}
                          {qty > 1 && a.pricingType !== 'PER_HOUR' && a.pricingType !== 'PER_DAY' && (
                            <span className="text-dark-brown/50 ml-1">(×{qty})</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-dark-brown/70">{pricingLabel}</td>
                        <td className="py-2.5 px-3 font-semibold text-dark-brown">{rateDisplay}</td>
                        <td className="py-2.5 px-3 font-semibold text-dark-brown text-right">{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gold/20">
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 font-bold text-rosewood">{t('adminMandapam.bookings.total') || 'Total'}</td>
                    <td className="py-2.5 px-3 font-bold text-rosewood text-right">
                      {formatCurrency(
                        booking.addonSnapshots.reduce((s, a) => s + a.amount * (a.quantity ?? 1) * (a.units ?? 1), 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </SectionCard3D>
      )}

      {/* ── Additional Charges ── */}
      <SectionCard3D>
        <div className="flex items-center justify-between">
          <SectionHeaderRedesigned
            title={t('adminMandapam.bookings.additionalCharges') || 'Additional Charges'}
            icon={<Gavel size={16} />}
            gradient="bg-ivory-gold-gradient text-rosewood"
            isTamil={isTamil}
          />
          {!['COMPLETED', 'CANCELLED'].includes(booking.status) && (
            <button
              onClick={() => openModal('add-charge')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-all"
            >
              <Gavel size={12} />
              {isTamil ? 'சேர்' : (t('common.add') || 'Add')}
            </button>
          )}
        </div>
        {chargeEntries.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gold/10 mt-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-rosewood/[0.03]">
                  <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.type') || 'Type'}</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.description') || 'Description'}</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.amount') || 'Amount'}</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-dark-brown w-12">{t('adminMandapam.bookings.action') || ''}</th>
                </tr>
              </thead>
              <tbody>
                {chargeEntries.map((e) => {
                  const chargeType = e.source === 'DAMAGE' ? 'damage' : e.source === 'PENALTY' ? 'penalty' : 'extra';
                  return (
                    <tr key={e.id} className="border-t border-gold/5 hover:bg-gold/[0.03] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-dark-brown">
                        {t(`adminMandapam.bookings.${CHARGE_TYPE_KEYS[chargeType]}`) || chargeType}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-dark-brown">
                        {e.description ? (isTamil ? e.description.ta || e.description.en : e.description.en || e.description.ta) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-dark-brown text-right">{formatCurrency(Number(e.amount))}</td>
                      <td className="py-2.5 px-3 text-right">
                        {!['COMPLETED', 'CANCELLED'].includes(booking.status) && (
                          <button
                            onClick={() => handleRemoveCharge(e.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title={isTamil ? 'அகற்று' : 'Remove'}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gold/20">
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 font-bold text-rosewood">{t('adminMandapam.bookings.total') || 'Total'}</td>
                  <td className="py-2.5 px-3 font-bold text-rosewood text-right">{formatCurrency(chargeEntries.reduce((s, e) => s + Number(e.amount), 0))}</td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-xs text-dark-brown/40 text-center py-2.5 mt-2">
            {isTamil ? 'கூடுதல் கட்டணங்கள் எதுவும் இல்லை' : (t('adminMandapam.bookings.noCharges') || 'No additional charges')}
          </p>
        )}
      </SectionCard3D>

      {/* ── Payments ── */}
      <SectionCard3D>
        <SectionHeaderRedesigned
          title={t('adminMandapam.bookings.payments') || 'Payments'}
          icon={<CreditCard size={16} />}
          gradient="bg-ivory-gold-gradient text-rosewood"
          isTamil={isTamil}
        />
        {(booking.paymentEntries?.length ?? 0) > 0 ? (
          <>
            <div className="overflow-hidden rounded-xl border border-gold/10">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-rosewood/[0.03]">
                      <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.date') || 'Date'}</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.paymentType') || 'Type'}</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.paymentMethod') || 'Method'}</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.amount') || 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.paymentEntries.map(p => (
                      <tr key={p.id} className="border-t border-gold/5 hover:bg-gold/[0.03] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-dark-brown/70">{format(new Date(p.receivedAt || p.createdAt), 'dd/MM/yyyy')}</td>
                        <td className="py-2.5 px-3 font-semibold text-dark-brown">{isTamil ? PAYMENT_TYPE_LABELS[p.paymentType]?.ta || p.paymentType : PAYMENT_TYPE_LABELS[p.paymentType]?.en || p.paymentType}</td>
                        <td className="py-2.5 px-3 text-dark-brown/80">{t(`adminMandapam.bookings.${PAYMENT_METHOD_KEYS[p.paymentMethod]}`) || p.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700 text-right">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gold/20">
                      <td className="py-2.5 px-3"></td>
                      <td className="py-2.5 px-3"></td>
                      <td className="py-2.5 px-3 font-bold text-rosewood">{t('adminMandapam.bookings.total') || 'Total'}</td>
                      <td className="py-2.5 px-3 font-bold text-rosewood text-right">{formatCurrency(totalPayments)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-dark-brown text-center py-3">
            {t('adminMandapam.bookings.noPayments') || 'No payment entries'}
          </p>
        )}

      </SectionCard3D>

      {/* ── Refunds ── */}
      {(booking.refundEntries?.length ?? 0) > 0 && (
        <SectionCard3D>
          <SectionHeaderRedesigned
            title={t('adminMandapam.bookings.refunds') || 'Refunds'}
            icon={<Shield size={16} />}
            gradient="bg-ivory-gold-gradient text-rosewood"
            isTamil={isTamil}
          />
          <div className="overflow-hidden rounded-xl border border-gold/10">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-rosewood/[0.03]">
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.date') || 'Date'}</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.refundStatus') || 'Type'}</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.refundMethod') || 'Method'}</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.cancelReason') || 'Reason'}</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.amount') || 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.refundEntries.map(r => (
                    <tr key={r.id} className="border-t border-gold/5 hover:bg-gold/[0.03] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-dark-brown/70">{format(new Date(r.createdAt), 'dd/MM/yyyy')}</td>
                        <td className="py-2.5 px-3 font-semibold text-dark-brown">{isTamil ? REFUND_TYPE_LABELS[r.refundType]?.ta || String(r.refundType).replace(/_/g, ' ') : REFUND_TYPE_LABELS[r.refundType]?.en || String(r.refundType).replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3 text-dark-brown/80">{r.refundMethod}</td>
                      <td className="py-2.5 px-3 text-dark-brown/50">{r.reason || '—'}</td>
                      <td className="py-2.5 px-3 font-semibold text-rose-700 text-right">{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gold/20">
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 font-bold text-rosewood">{t('adminMandapam.bookings.total') || 'Total'}</td>
                    <td className="py-2.5 px-3 font-bold text-rosewood text-right">{formatCurrency(totalRefunds)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </SectionCard3D>
      )}

      {/* ── Summary ── */}
      <SectionCard3D>
        <SectionHeaderRedesigned
          title={t('adminMandapam.bookings.summary') || 'Summary'}
          icon={<Receipt size={16} />}
          gradient="bg-ivory-gold-gradient text-rosewood"
          isTamil={isTamil}
        />

        <div className="overflow-hidden rounded-xl border border-gold/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-rosewood/[0.03]">
                <th className="text-left py-2.5 px-3 font-semibold text-rosewood">
                  {t('adminMandapam.bookings.description') || 'Description'}
                </th>
                <th className="text-right py-2.5 px-3 font-semibold text-rosewood">
                  {t('adminMandapam.bookings.amount') || 'Amount'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(booking.ledgerEntries?.filter(e => e.source !== 'DISCOUNT') ?? []).length > 0 ? (
                booking.ledgerEntries.filter(e => e.source !== 'DISCOUNT').map((e, i) => (
                  <tr key={e.id || i} className="border-t border-gold/5 hover:bg-gold/[0.03] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-dark-brown">{getLedgerLabel(e, isTamil)}</td>
                    <td className="py-2.5 px-3 font-semibold text-dark-brown text-right">{formatCurrency(Number(e.amount))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-center text-dark-brown/50">
                    {t('adminMandapam.bookings.noCharges') || 'No charge entries'}
                  </td>
                </tr>
              )}

            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gold/20">
                <td className="py-2.5 px-3 font-bold text-rosewood">{t('adminMandapam.bookings.totalCharges') || 'Total Charges'}</td>
                <td className="py-2.5 px-3 font-bold text-rosewood text-right">{formatCurrency(totalCharges + discountTotal)}</td>
              </tr>
              {discountTotal > 0 && (
                <tr className="border-t border-gold/5">
                  <td className="py-2.5 px-3 font-semibold text-dark-brown/70">{t('adminMandapam.bookings.discountLabel') || 'Discount'}</td>
                  <td className="py-2.5 px-3 font-semibold text-rose-600 text-right">({formatCurrency(discountTotal)})</td>
                </tr>
              )}
              {discountTotal > 0 && (
                <tr className="border-t border-gold/5">
                  <td className="py-2.5 px-3 font-semibold text-rosewood">{t('adminMandapam.bookings.discountedTotal') || 'Discounted Total'}</td>
                  <td className="py-2.5 px-3 font-semibold text-rosewood text-right">{formatCurrency(totalCharges)}</td>
                </tr>
              )}
              <tr className="border-t border-gold/5">
                <td className="py-2.5 px-3 font-semibold text-dark-brown">{t('adminMandapam.bookings.paidToDate') || 'Paid'}</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-700 text-right">{formatCurrency(totalPayments)}</td>
              </tr>
              <tr className="border-t border-gold/5">
                <td className="py-2.5 px-3 font-bold text-rosewood">{t('adminMandapam.bookings.balanceDue') || 'Balance'}</td>
                <td className={`py-2.5 px-3 font-bold text-right ${outstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{formatCurrency(outstanding)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard3D>



      {/* ── Cancellation Info ── */}
      {booking.status === 'CANCELLED' && (
        <SectionCard3D>
          <SectionHeaderRedesigned
            title={t('adminMandapam.bookings.cancellationInfo') || 'Cancellation Info'}
            icon={<XCircle size={16} />}
            gradient="bg-rose-50 text-rose-700"
            isTamil={isTamil}
          />
          <div className="space-y-1.5">
            {cancelledAt && (
              <DetailRow label={t('adminMandapam.bookings.cancelledOn') || 'Cancelled on'} value={format(new Date(cancelledAt), 'dd MMM yyyy, h:mm a', { locale: isTamil ? ta : undefined })} />
            )}
            {cancelReason && (
              <DetailRow label={t('adminMandapam.bookings.cancelReason') || 'Reason'} value={cancelReason} />
            )}
            {(booking.refundEntries?.length ?? 0) > 0 && (
              <DetailRow label={t('adminMandapam.bookings.refunds') || 'Refund'} value={
                `${formatCurrency(booking.refundEntries.reduce((s, r) => s + Number(r.amount), 0))} via ${booking.refundEntries.map(r => r.refundMethod).join(', ')}`
              } />
            )}
            {((booking.totalPayments ?? 0) > 0) && (
              <DetailRow label={t('adminMandapam.bookings.netForfeited') || 'Net forfeited'} value={formatCurrency((booking.totalPayments ?? 0) - (booking.totalRefunds ?? 0))} />
            )}
          </div>
        </SectionCard3D>
      )}

      {/* ── Actions ── */}
      <SectionCard3D>
        <SectionHeaderRedesigned
          title={t('adminMandapam.bookings.actions') || 'Actions'}
          icon={<Shield size={16} />}
          gradient="bg-rosewood-gradient text-white"
          isTamil={isTamil}
        />
        <div className="flex flex-wrap gap-2.5 w-full">
          {visibility.endEvent && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={() => openModal('end-event')}
              className={`${btnBase} flex-1 min-w-[130px] bg-amber-500 text-white shadow-amber-500/20`}
            >
              <Flag size={16} />
              <span className="truncate">{t('adminMandapam.bookings.endEvent') || 'End Event'}</span>
            </motion.button>
          )}
          {visibility.complete && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={() => openModal('complete')}
              className={`${btnBase} flex-1 min-w-[130px] bg-emerald-600 text-white shadow-emerald-600/20`}
            >
              <CheckCircle size={16} />
              <span className="truncate">{t('adminMandapam.bookings.complete') || 'Complete'}</span>
            </motion.button>
          )}
          {visibility.cancel && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={() => openModal('cancel')}
              className={`${btnBase} flex-1 min-w-[130px] bg-rose-600 text-white shadow-rose-600/20`}
            >
              <XCircle size={16} />
              <span className="truncate">{t('adminMandapam.bookings.cancelRefund') || 'Cancel & Refund'}</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={() => setIsPrintingInvoice(true)}
            className={`${btnBase} flex-1 min-w-[130px] bg-rosewood-gradient text-white`}
          >
            <Printer size={16} />
            <span className="truncate">{t('adminMandapam.bookings.printInvoice') || 'Print Invoice'}</span>
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={() => openModal('timeline')}
            className={`${btnBase} flex-1 min-w-[130px] bg-sage text-white shadow-sage/20`}
          >
            <History size={16} />
            <span className="truncate">{t('adminMandapam.bookings.viewTimeline') || 'View Timeline'}</span>
          </motion.button>
        </div>
      </SectionCard3D>

      {/* ── Modals ── */}
      <ModalShell
        isOpen={activeModal === 'end-event'}
        onClose={closeModal}
        icon={<div className="p-2 bg-amber-50 rounded-xl"><Flag className="text-amber-600" size={20} /></div>}
        title={t('adminMandapam.bookings.endEventTitle') || 'End Event'}
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={closeModal} disabled={bookingWrite.isPending}
              className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-semibold rounded-xl hover:bg-ivory transition-all text-sm disabled:opacity-50">
              {t('common.cancel') || 'Cancel'}
            </button>
            <button onClick={handleConfirmEndEvent} disabled={bookingWrite.isPending}
              className="flex-1 px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-all text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {bookingWrite.isPending && <Loader2 size={14} className="animate-spin" />}
              {t('adminMandapam.bookings.confirmEndEvent') || 'Yes, End Event'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-dark-brown leading-relaxed">
          {t('adminMandapam.bookings.endEventDescription') || 'This will mark the event as ended and move the booking to settlement pending status.'}
        </p>
      </ModalShell>

      <AddChargeModal
        isOpen={activeModal === 'add-charge'}
        bookingId={booking.id}
        onClose={closeModal}
        t={t}
      />

      <CompleteBookingModal
        isOpen={activeModal === 'complete'}
        booking={booking}
        onClose={closeModal}
        t={t}
        isSubmitting={bookingWrite.isPending}
        onConfirm={handleConfirmComplete}
      />

      <CancelRefundModal
        isOpen={activeModal === 'cancel'}
        booking={booking}
        onClose={closeModal}
        t={t}
        isSubmitting={bookingWrite.isPending}
        onConfirm={handleConfirmCancel}
      />

      <BookingInvoiceModal
        isOpen={activeModal === 'invoice'}
        booking={booking}
        onClose={closeModal}
        t={t}
        isTamil={isTamil}
        charges={totalCharges}
        payments={totalPayments}
        refunds={totalRefunds}
        outstanding={outstanding}
      />

      {/* ── Timeline Modal ── */}
      <ModalShell
        isOpen={activeModal === 'timeline'}
        onClose={closeModal}
        icon={<div className="p-2 bg-emerald-50 rounded-xl"><History className="text-emerald-600" size={20} /></div>}
        title={t('adminMandapam.bookings.timeline') || 'Timeline'}
        size="lg"
        footer={
          <div className="flex justify-end">
            <button onClick={closeModal}
              className="px-6 py-2.5 border border-gold/20 text-rosewood font-semibold rounded-xl hover:bg-ivory transition-all text-sm">
              {t('common.close') || 'Close'}
            </button>
          </div>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-0">
          {(booking.timeline?.length ?? 0) > 0 ? (
            <div className="space-y-0">
              {[...booking.timeline].reverse().map((entry, i) => {
                const isLast = i === booking.timeline.length - 1;
                const statusMatch = TIMELINE_STATUS_COLORS[entry.event] || TIMELINE_STATUS_COLORS[entry.metadata?.to] || '';
                const isTokenEvent = entry.event === 'TOKEN_CONSUMED' || entry.event === 'TOKEN_ISSUED' || entry.event === 'TOKEN_REVERSED';
                const isPaymentEvent = entry.event === 'PAYMENT_ADDED' || entry.event === 'PAYMENT_RECEIVED';
                const accentColor = entry.metadata?.to === 'CANCELLED' ? 'border-l-rose-400'
                  : entry.metadata?.to === 'COMPLETED' ? 'border-l-emerald-400'
                  : entry.event === 'TOKEN_CONSUMED' || entry.event === 'TOKEN_ISSUED' ? 'border-l-emerald-400'
                  : entry.event === 'TOKEN_REVERSED' ? 'border-l-amber-400'
                  : isPaymentEvent ? 'border-l-emerald-400'
                  : 'border-l-slate-300';
                return (
                  <div key={entry.id || i} className={`border-l-[3px] pl-4 py-3 ${accentColor} ${!isLast ? 'border-b border-gold/10' : ''}`}>
                    {entry.metadata?.from && entry.metadata?.to ? (
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${TIMELINE_STATUS_COLORS[entry.metadata.from] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {getStatusLabel(entry.metadata.from, t, language)}
                        </span>
                        <span className="text-gold/40 text-xs font-semibold">→</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${TIMELINE_STATUS_COLORS[entry.metadata.to] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {getStatusLabel(entry.metadata.to, t, language)}
                        </span>
                      </div>
                    ) : isPaymentEvent ? (
                      <p className="font-semibold text-rosewood text-sm mb-1">
                        {getTimelineEventLabel(entry.event, isTamil)}
                        {entry.metadata?.amount && ` · ${formatCurrency(Number(entry.metadata.amount))}`}
                        {entry.metadata?.method && ` ${t('adminMandapam.bookings.via') || 'via'} ${entry.metadata.method}`}
                      </p>
                    ) : (
                      <p className="font-semibold text-rosewood text-sm mb-1">{getTimelineEventLabel(entry.event, isTamil)}</p>
                    )}
                    <div className="text-xs text-dark-brown mb-0.5">
                      {entry.metadata?.performedBy && (
                        <span>{entry.metadata.performedBy} · </span>
                      )}
                      <span>{format(new Date(entry.createdAt), 'dd MMM yyyy, h:mm a', { locale: isTamil ? ta : undefined })}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-dark-brown italic mt-1">{entry.notes}</p>
                    )}
                    {isTokenEvent && entry.metadata?.tokenNumbers && (
                      <p className="text-xs text-dark-brown italic mt-0.5">
                        {t('adminMandapam.bookings.tokens') || 'Tokens'}: {entry.metadata.tokenNumbers}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <History size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-dark-brown font-medium">
                {t('adminMandapam.bookings.noTimelineEntries') || 'No timeline entries'}
              </p>
            </div>
          )}
        </div>
      </ModalShell>
    </motion.div>
  );
};

export default BookingDetailView;
