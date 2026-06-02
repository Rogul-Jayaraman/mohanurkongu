import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { BookingsFilter } from '@/components/features/admin/mandapam/bookings/BookingsFilter';
import { BookingsTable } from '@/components/features/admin/mandapam/bookings/BookingsTable';
import { AddPaymentModal } from '@/modals/admin/AddPaymentModal';
import { CompleteBookingModal } from '@/modals/admin/CompleteBookingModal';
import { CancelRefundModal } from '@/modals/admin/CancelRefundModal';
import { ViewBookingModal } from '@/modals/admin/ViewBookingModal';
import { useBookingList } from '@/queries/useMandapamQueries';
import { useBookingWrite } from '@/queries/useMandapamMutations';
import type { Booking } from '@/types/mandapam';
import { CalendarCheck, CalendarRange, CheckCircle2, XCircle, BarChart3, Loader2, ClipboardList } from 'lucide-react';

type ActiveModal = 'view' | 'payment' | 'complete' | 'cancel' | null;

const STAGGER = 0.04;

const StatSkeleton = () => (
  <div className="rounded-2xl border border-gold/5 p-4 bg-white/60 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-rosewood/10 shrink-0" />
      <div className="space-y-2">
        <div className="h-5 w-12 bg-rosewood/10 rounded" />
        <div className="h-3 w-16 bg-rosewood/5 rounded" />
      </div>
    </div>
  </div>
);

const BookingManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = { page: currentPage, limit: itemsPerPage };
    if (statusFilter !== 'All') f.status = statusFilter;
    if (searchQuery) f.search = searchQuery;
    return f;
  }, [currentPage, statusFilter, searchQuery]);

  const { data, isLoading, isFetching, error, refetch } = useBookingList(filters);
  const bookingWrite = useBookingWrite();

  const bookings = data?.bookings ?? [];
  const totalItems = data?.meta?.total ?? 0;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
    const inProgress = bookings.filter(b => b.status === 'EVENT_IN_PROGRESS').length;
    const pendingSettlement = bookings.filter(b => b.status === 'SETTLEMENT_PENDING' || b.status === 'EVENT_COMPLETED').length;
    const completed = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
    return { total, confirmed, inProgress, pendingSettlement, completed, cancelled };
  }, [bookings]);

  const STAT_CARDS = [
    { label: 'Total', value: stats.total, icon: BarChart3, gradient: 'from-rosewood/10 to-rosewood/5', iconBg: 'bg-rosewood/10', iconColor: 'text-rosewood/50', textColor: 'text-rosewood' },
    { label: 'Confirmed', value: stats.confirmed, icon: CalendarCheck, gradient: 'from-sky-100 to-sky-50', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', textColor: 'text-sky-700' },
    { label: 'Ongoing', value: stats.inProgress, icon: CalendarRange, gradient: 'from-blue-100 to-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', textColor: 'text-blue-700' },
    { label: 'Pending Settlement', value: stats.pendingSettlement, icon: ClipboardList, gradient: 'from-amber-100 to-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', textColor: 'text-amber-700' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, gradient: 'from-emerald-100 to-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', textColor: 'text-emerald-700' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, gradient: 'from-rose-100 to-rose-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', textColor: 'text-rose-700' },
  ];

  const openModal = (modal: ActiveModal, booking: Booking) => {
    setSelectedBooking(booking);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedBooking(null);
  };

  const handleConfirmPayment = async (booking: Booking, paymentType: string, amount: string, paymentMethod: string, referenceNo: string, notes: string) => {
    const numAmount = Number(amount.replace?.(/,/g, '') ?? amount);
    await bookingWrite.mutateAsync({
      bookingId: booking.id,
      action: {
        type: 'add-payment',
        paymentType,
        paymentMethod,
        amount: numAmount,
        referenceNo: referenceNo || undefined,
        notes: notes || undefined,
      },
    });
    closeModal();
  };

  const handleConfirmCancel = async (booking: Booking, refundType: string, refundAmount: string, refundMethod: string, reason: string) => {
    if (refundType !== 'NO_REFUND' && refundAmount) {
      const numAmount = Number(refundAmount.replace?.(/,/g, '') ?? refundAmount);
      await bookingWrite.mutateAsync({
        bookingId: booking.id,
        action: { type: 'add-refund', refundType, refundMethod, amount: numAmount, reason },
      });
    }
    await bookingWrite.mutateAsync({
      bookingId: booking.id,
      action: { type: 'update-status', status: 'CANCELLED', notes: reason },
    });
    closeModal();
  };

  const handleConfirmComplete = async (booking: Booking, mode: string, amount: string, paymentMethod: string) => {
    if (mode === 'fully_settled' && amount) {
      const numAmount = Number(amount.replace?.(/,/g, '') ?? amount);
      if (numAmount > 0) {
        await bookingWrite.mutateAsync({
          bookingId: booking.id,
          action: { type: 'add-payment', paymentType: 'FINAL_PAYMENT', paymentMethod, amount: numAmount },
        });
      }
      await bookingWrite.mutateAsync({
        bookingId: booking.id,
        action: { type: 'update-status', status: 'COMPLETED' },
      });
    } else if (mode === 'discount') {
      const numAmount = amount ? Number(amount.replace?.(/,/g, '') ?? amount) : undefined;
      await bookingWrite.mutateAsync({
        bookingId: booking.id,
        action: { type: 'settlement', action: 'complete', finalAmount: numAmount },
      });
    }
    closeModal();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 md:space-y-6">

      {/* Stats Cards — loading skeleton or actual cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {isLoading && data === undefined
          ? Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <StatSkeleton />
              </motion.div>
            ))
          : STAT_CARDS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * STAGGER }}
                className={`bg-gradient-to-br ${stat.gradient} rounded-2xl border border-gold/5 p-3.5 flex items-center gap-3`}
              >
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} border border-white/50 flex items-center justify-center shrink-0`}>
                  <stat.icon size={18} className={stat.iconColor} />
                </div>
                <div className="min-w-0">
                  <p className={`text-lg font-black ${stat.textColor} leading-none`}>{stat.value}</p>
                  <p className="text-[9px] font-bold text-rosewood/40 mt-1 uppercase tracking-wider leading-tight">{stat.label}</p>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Filter */}
      <BookingsFilter
        t={t}
        searchQuery={searchQuery}
        setSearchQuery={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        statusFilter={statusFilter}
        setStatusFilter={(v) => { setStatusFilter(v); setCurrentPage(1); }}
      />

      {/* Loading overlay for refetches */}
      <div className="relative">
        {isFetching && bookings.length > 0 && (
          <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-xl shadow-sm border border-gold/10">
              <Loader2 size={14} className="animate-spin text-rosewood/60" />
              <span className="text-xs font-bold text-rosewood/60">Refreshing...</span>
            </div>
          </div>
        )}
        <BookingsTable
          t={t}
          language={language}
          bookings={bookings}
          loading={isLoading && bookings.length === 0}
          error={error ? (error as Error).message : null}
          onRetry={() => refetch()}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onViewDetails={(b) => openModal('view', b)}
          onModifyPayment={(b) => openModal('payment', b)}
          onComplete={(b) => openModal('complete', b)}
          onCancel={(b) => openModal('cancel', b)}
        />
      </div>

      {/* Modals */}
      <AddPaymentModal
        isOpen={activeModal === 'payment'}
        booking={selectedBooking}
        onClose={closeModal}
        t={t}
        isSubmitting={bookingWrite.isPending}
        onConfirm={handleConfirmPayment}
      />
      <CompleteBookingModal
        isOpen={activeModal === 'complete'}
        booking={selectedBooking}
        onClose={closeModal}
        t={t}
        isSubmitting={bookingWrite.isPending}
        onConfirm={handleConfirmComplete}
      />
      <CancelRefundModal
        isOpen={activeModal === 'cancel'}
        booking={selectedBooking}
        onClose={closeModal}
        t={t}
        isSubmitting={bookingWrite.isPending}
        onConfirm={handleConfirmCancel}
      />
      <ViewBookingModal
        isOpen={activeModal === 'view'}
        booking={selectedBooking}
        onClose={closeModal}
        t={t}
      />
    </motion.div>
  );
};

export default BookingManagement;
