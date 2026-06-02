import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, CreditCard, CheckCircle2, XCircle, MoreVertical, Clock, User, Phone, Hash, CalendarDays, DollarSign } from 'lucide-react';
import { DataTable } from '@/components/ui/table/DataTable';
import type { Column } from '@/components/ui/table/DataTable';
import type { Booking, BookingStatus } from '@/types/mandapam';
import { formatCurrency } from '@/utils/format';
import { getBookingStatusStyle, getBookingPaymentStatus } from '@/constants/admin/statusColors';

interface BookingsTableProps {
  t: any;
  language: string;
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onViewDetails: (b: Booking) => void;
  onModifyPayment: (b: Booking) => void;
  onComplete: (b: Booking) => void;
  onCancel: (b: Booking) => void;
}

const getPaymentStatusStyle = (booking: Booking) => getBookingPaymentStatus(booking);

const ACTION_VISIBILITY: Record<BookingStatus, { view: boolean; payment: boolean; complete: boolean; cancel: boolean }> = {
  CONFIRMED: { view: true, payment: true, complete: false, cancel: true },
  EVENT_IN_PROGRESS: { view: true, payment: true, complete: false, cancel: true },
  EVENT_COMPLETED: { view: true, payment: true, complete: true, cancel: true },
  SETTLEMENT_PENDING: { view: true, payment: true, complete: true, cancel: true },
  COMPLETED: { view: true, payment: false, complete: false, cancel: false },
  CANCELLED: { view: true, payment: false, complete: false, cancel: false },
};

const ActionDropdown: React.FC<{
  booking: Booking;
  onViewDetails: (b: Booking) => void;
  onModifyPayment: (b: Booking) => void;
  onComplete: (b: Booking) => void;
  onCancel: (b: Booking) => void;
}> = ({ booking, onViewDetails, onModifyPayment, onComplete, onCancel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        const dropdown = document.getElementById(`dropdown-${booking.id}`);
        if (dropdown && !dropdown.contains(e.target as Node)) setIsOpen(false);
        if (!dropdown) setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [booking.id]);

  const visibility = ACTION_VISIBILITY[booking.status] || ACTION_VISIBILITY.CONFIRMED;

  const items: { icon: any; label: string; action: (b: Booking) => void; color: string; visible: boolean }[] = [
    { icon: Eye, label: 'View Details', action: onViewDetails, color: 'text-rosewood hover:bg-rosewood/5', visible: visibility.view },
    { icon: CreditCard, label: 'Add Payment', action: onModifyPayment, color: 'text-blue-600 hover:bg-blue-50', visible: visibility.payment },
    { icon: CheckCircle2, label: 'Complete', action: onComplete, color: 'text-emerald-600 hover:bg-emerald-50', visible: visibility.complete },
    { icon: XCircle, label: 'Cancel & Refund', action: onCancel, color: 'text-rose-600 hover:bg-rose-50', visible: visibility.cancel },
  ];

  const visibleItems = items.filter(i => i.visible);
  if (visibleItems.length === 0) return null;

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-transparent hover:border-gold/20 hover:bg-ivory/80 text-rosewood/40 hover:text-rosewood transition-all active:scale-90"
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <motion.div
            id={`dropdown-${booking.id}`}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 50 }}
            className="min-w-[190px] bg-white border border-gold/10 rounded-xl shadow-xl py-1.5 overflow-hidden"
          >
            {visibleItems.map((item, i) => (
              <button
                key={i}
                onClick={() => { setIsOpen(false); item.action(booking); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-all ${item.color}`}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </motion.div>
        </>,
        document.body
      )}
    </div>
  );
};

export const BookingsTable: React.FC<BookingsTableProps> = ({
  t, language, bookings, loading, error, onRetry,
  currentPage, totalPages, totalItems, itemsPerPage, onPageChange,
  onViewDetails, onModifyPayment, onComplete, onCancel,
}) => {
  const columns: Column<Booking>[] = [
    {
      header: 'Booking',
      width: '160px',
      className: 'font-medium',
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rosewood/10 to-rosewood/5 border border-gold/10 flex items-center justify-center shrink-0">
            <Hash size={16} className="text-rosewood/60" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-rosewood leading-tight truncate">{b.bookingNo}</p>
            <p className="text-[10px] font-medium text-rosewood/40 mt-0.5">{b.packageCode}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      width: '180px',
      render: (b) => (
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rosewood/15 to-rosewood/5 border border-gold/10 flex items-center justify-center shrink-0 mt-0.5">
            <User size={13} className="text-rosewood/50" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-rosewood/80 leading-tight truncate">
              {language === 'ta' ? b.customerName.ta : b.customerName.en}
            </p>
            <p className="text-[11px] text-rosewood/40 mt-0.5 flex items-center gap-1">
              <Phone size={10} />
              {b.customerPhone}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Event',
      width: '160px',
      render: (b) => (
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-rosewood/80 truncate leading-tight">
            {language === 'ta' ? b.eventTitle.ta : b.eventTitle.en}
          </p>
          <p className="text-[10px] font-medium text-rosewood/40 mt-0.5 uppercase tracking-wider">
            {b.eventType.replace(/_/g, ' ')}
          </p>
        </div>
      ),
    },
    {
      header: 'Schedule',
      width: '160px',
      render: (b) => (
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-rosewood/70 font-mono flex items-center gap-1">
            <CalendarDays size={11} className="text-rosewood/40 shrink-0" />
            {new Date(b.bookingConfig.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {b.bookingConfig.startTime && (
            <p className="text-[10px] text-rosewood/40 mt-0.5 flex items-center gap-1">
              <Clock size={9} />
              {b.bookingConfig.startTime}{b.bookingConfig.endTime ? ` - ${b.bookingConfig.endTime}` : ''}
            </p>
          )}
          <p className="text-[9px] font-bold text-rosewood/30 mt-0.5 uppercase tracking-wider">
            {b.bookingType === 'HOURLY' ? 'Hourly' : b.bookingType === 'ONE_DAY' ? '1 Day' : '2 Day'}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      width: '120px',
      render: (b) => {
        const s = getBookingStatusStyle(b.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.text.replace('text-', 'bg-').replace('-700', '-500')}`} />
            {b.status === 'SETTLEMENT_PENDING' ? 'Settlement' : b.status.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      header: 'Balance',
      width: '120px',
      render: (b) => {
        const ps = getPaymentStatusStyle(b);
        return (
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${ps.bg} ${ps.color}`}>
              <DollarSign size={10} />
              {ps.label}
            </span>
            <p className={`text-[12px] font-bold mt-1 font-mono ${ps.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(ps.outstanding)}
            </p>
          </div>
        );
      },
    },
    {
      header: '',
      width: '60px',
      className: 'text-right',
      render: (b) => (
        <ActionDropdown
          booking={b}
          onViewDetails={onViewDetails}
          onModifyPayment={onModifyPayment}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/80 backdrop-blur border-2 border-rose-200/50 rounded-2xl">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center border border-rose-200">
          <XCircle size={24} className="text-rose-400" />
        </div>
        <p className="text-rose-600 font-bold text-sm">{error}</p>
        <button onClick={onRetry} className="px-6 py-2.5 rounded-xl bg-rosewood text-white font-bold text-xs uppercase tracking-wider hover:shadow-lg transition-all active:scale-95">
          {t('common.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        pagination={{ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }}
        emptyState={{
          title: t('adminMandapam.bookings.noBookings') || 'No bookings found',
          description: t('adminMandapam.bookings.noBookingsDesc') || 'No matching bookings found. Try adjusting your search or filters.',
        }}
      />
    </motion.div>
  );
};
