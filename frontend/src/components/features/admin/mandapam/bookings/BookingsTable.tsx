import React from 'react';
import { Eye, XCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/table/DataTable';
import type { Column } from '@/components/ui/table/DataTable';
import type { Booking } from '@/types/mandapam';
import { getBookingStatusStyle } from '@/constants/admin/statusColors';
import { useDateFormatter } from '@/hooks/useDateFormatter';

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
}

const STATUS_LABEL: Record<string, { en: string; ta: string }> = {
  CONFIRMED: { en: 'Confirmed', ta: 'உறுதிப்படுத்தப்பட்டது' },
  IN_PROGRESS: { en: 'Event In Progress', ta: 'நிகழ்வு நடைபெறுகிறது' },
  SETTLEMENT_PENDING: { en: 'Settlement Pending', ta: 'தீர்வு நிலுவை' },
  COMPLETED: { en: 'Completed', ta: 'முடிக்கப்பட்டது' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
};

const getStatusLabel = (status: string, language: string): string => {
  const label = STATUS_LABEL[status];
  return label ? (language === 'ta' ? label.ta : label.en) : status.replace(/_/g, ' ');
};

export const BookingsTable: React.FC<BookingsTableProps> = ({
  t, language, bookings, loading, error, onRetry,
  currentPage, totalPages, totalItems, itemsPerPage, onPageChange,
  onViewDetails,
}) => {
  const { formatDate } = useDateFormatter();

  const formatDateRange = (startDate: string, endDate: string) => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!endDate || isNaN(e.getTime()) || s.toDateString() === e.toDateString()) {
      return formatDate(startDate, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const sameMonthYear = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const sameYear = s.getFullYear() === e.getFullYear();
    if (sameMonthYear) return `${s.getDate()} - ${formatDate(endDate, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (sameYear) return `${formatDate(startDate, { day: 'numeric', month: 'short' })} - ${formatDate(endDate, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    return `${formatDate(startDate, { day: 'numeric', month: 'short', year: 'numeric' })} - ${formatDate(endDate, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const columns: Column<Booking>[] = [
    {
      header: 'Booking No',
      width: '100px',
      render: (b) => (
        <p className="text-[13px] font-bold text-rosewood leading-tight">{b.bookingNo}</p>
      ),
    },
    {
      header: 'Customer',
      width: '180px',
      render: (b) => (
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-rosewood/80 leading-tight truncate">
            {language === 'ta' ? b.customerName.ta : b.customerName.en}
          </p>
          <p className="text-[11px] text-rosewood/40 mt-0.5">{b.customerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Event',
      width: '160px',
      render: (b) => (
        <p className="text-[13px] font-bold text-rosewood/80 truncate leading-tight">
          {language === 'ta' ? b.eventTitle.ta : b.eventTitle.en}
        </p>
      ),
    },
    {
      header: 'Schedule',
      width: '140px',
      render: (b) => (
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-rosewood/70 leading-tight">
            {formatDateRange(b.bookingConfig.startDate, b.bookingConfig.endDate)}
          </p>
          {b.bookingConfig.startTime && (
            <p className="text-[11px] text-rosewood/40 mt-0.5">
              {b.bookingConfig.startTime}{b.bookingConfig.endTime ? ` - ${b.bookingConfig.endTime}` : ''}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      width: '140px',
      render: (b) => {
        const s = getBookingStatusStyle(b.status);
        return (
          <span className={`text-xs font-bold ${s.text}`}>
            {getStatusLabel(b.status, language)}
          </span>
        );
      },
    },
    {
      header: '',
      width: '60px',
      className: 'text-right',
      render: (b) => (
        <button
          onClick={() => onViewDetails(b)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-transparent hover:border-gold/20 hover:bg-ivory/80 text-rosewood/40 hover:text-rosewood transition-all active:scale-90"
          title={t('adminMandapam.bookings.viewDetails') || 'View Details'}
        >
          <Eye size={16} />
        </button>
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
  );
};
