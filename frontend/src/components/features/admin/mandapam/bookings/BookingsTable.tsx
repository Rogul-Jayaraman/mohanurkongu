import React from 'react';
import { motion } from 'framer-motion';
import { Eye, CreditCard, XCircle, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/table/DataTable';
import type { Column } from '@/components/ui/table/DataTable';
import type { Booking } from '@/types/mandapam';

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
  onDelete: (b: Booking) => void;
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  EVENT_IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  EVENT_COMPLETED: 'bg-purple-100 text-purple-700 border-purple-200',
  SETTLEMENT_PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const BookingsTable: React.FC<BookingsTableProps> = ({
  t, language, bookings, loading, error, onRetry,
  currentPage, totalPages, totalItems, itemsPerPage, onPageChange,
  onViewDetails, onModifyPayment, onComplete, onCancel, onDelete,
}) => {
  const columns: Column<Booking>[] = [
    {
      header: t('adminMandapam.bookings.bookingNo') || 'Booking #',
      key: 'bookingNo',
      className: 'font-mono font-bold text-xs',
    },
    {
      header: t('adminMandapam.bookings.customer') || 'Customer',
      render: (b) => language === 'ta' ? b.customerName.ta : b.customerName.en,
      className: 'font-medium',
    },
    {
      header: t('adminMandapam.bookings.phone') || 'Phone',
      key: 'customerPhone',
    },
    {
      header: t('adminMandapam.bookings.event') || 'Event',
      render: (b) => language === 'ta' ? b.eventTitle.ta : b.eventTitle.en,
      className: 'max-w-[200px] truncate',
    },
    {
      header: t('adminMandapam.bookings.dates') || 'Dates',
      render: (b) => `${b.bookingConfig.startDate} → ${b.bookingConfig.endDate}`,
      className: 'text-xs font-mono',
    },
    {
      header: t('adminMandapam.bookings.status') || 'Status',
      render: (b) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-700'}`}>
          {b.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: t('adminMandapam.bookings.outstanding') || 'Outstanding',
      render: (b) => {
        const outstanding = b._outstanding ?? 0;
        return (
          <span className={`font-mono font-bold text-xs ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{outstanding.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: t('adminMandapam.bookings.actions') || 'Actions',
      render: (b) => (
        <div className="flex items-center gap-1">
          <button onClick={() => onViewDetails(b)} className="p-1.5 rounded-lg hover:bg-rosewood/5 text-rosewood/50 hover:text-rosewood transition-all" title={t('common.view') || 'View'}>
            <Eye size={14} />
          </button>
          <button onClick={() => onModifyPayment(b)} className="p-1.5 rounded-lg hover:bg-rosewood/5 text-rosewood/50 hover:text-rosewood transition-all" title={t('adminMandapam.bookings.payment') || 'Payment'}>
            <CreditCard size={14} />
          </button>
          <button onClick={() => onComplete(b)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 transition-all" title={t('adminMandapam.bookings.complete') || 'Complete'}>
            <CheckCircle size={14} />
          </button>
          <button onClick={() => onCancel(b)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-all" title={t('adminMandapam.bookings.cancel') || 'Cancel'}>
            <XCircle size={14} />
          </button>
          <button onClick={() => onDelete(b)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all" title={t('common.delete') || 'Delete'}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/10 backdrop-blur-2xl border-2 border-gold/20 rounded-xl">
        <p className="text-rose-500 font-medium">{error}</p>
        <button onClick={onRetry} className="px-6 py-2 rounded-xl bg-rosewood text-white font-bold text-sm">{t('common.retry') || 'Retry'}</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        pagination={{ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }}
        emptyState={{
          title: t('adminMandapam.bookings.noBookings') || 'No bookings found',
        }}
      />
    </motion.div>
  );
};
