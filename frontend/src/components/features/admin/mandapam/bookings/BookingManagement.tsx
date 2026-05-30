import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { BookingsFilter } from '@/components/features/admin/mandapam/bookings/BookingsFilter';
import { BookingsTable } from '@/components/features/admin/mandapam/bookings/BookingsTable';
import { NewBookingModal } from '@/modals/admin/NewBookingModal';
import { CancelRefundModal } from '@/modals/admin/CancelRefundModal';
import { CompleteBookingModal } from '@/modals/admin/CompleteBookingModal';
import { ModifyPaymentModal } from '@/modals/admin/ModifyPaymentModal';
import { ViewDetailsModal } from '@/modals/admin/ViewDetailsModal';
import { CancelConfirmationModal } from '@/modals/admin/CancelConfirmationModal';
import {
  adminListBookings,
  adminUpdateBookingStatus,
  adminAddPayment,
  adminAddRefund,
  adminSettlementAction,
} from '@/api/mandapam.api';
import type { Booking } from '@/types/mandapam';
import { toast } from 'sonner';

const BookingManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: any = { page: currentPage, limit: itemsPerPage };
      if (statusFilter !== 'All') filters.status = statusFilter;
      if (searchQuery) filters.search = searchQuery;
      const { bookings, meta } = await adminListBookings(filters);
      setBookings(bookings || []);
      setTotalItems(meta?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handleConfirmPayment = async (booking: Booking, paymentType: string, amount: string, paymentMethod: string) => {
    try {
      const numAmount = Number(amount.replace?.(/,/g, '') ?? amount);
      await adminAddPayment(booking.id, {
        paymentType: paymentType as 'ADVANCE' | 'INSTALLMENT' | 'FINAL_PAYMENT',
        paymentMethod: paymentMethod as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE',
        amount: numAmount,
      });
      toast.success(t('adminMandapam.bookings.paymentAddedToast'));
      setIsPaymentModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || t('adminMandapam.bookings.addPaymentError'));
    }
  };

  const handleConfirmCancel = async (booking: Booking, refundType: string, refundAmount: string, refundMethod: string) => {
    try {
      if (refundType !== 'NO_REFUND' && refundAmount) {
        const numAmount = Number(refundAmount.replace?.(/,/g, '') ?? refundAmount);
        await adminAddRefund(booking.id, {
          refundType: refundType as 'PARTIAL_REFUND' | 'FULL_REFUND',
          refundMethod: refundMethod as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE',
          amount: numAmount,
          reason: 'Cancellation refund',
        });
      }
      await adminUpdateBookingStatus(booking.id, { status: 'CANCELLED' });
      toast.success(t('adminMandapam.bookings.cancelledToast'));
      setIsCancelModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || t('adminMandapam.bookings.cancelError'));
    }
  };

  const handleConfirmComplete = async (booking: Booking, mode: string, amount: string, paymentMethod: string) => {
    try {
      if (mode === 'fully_settled' && amount) {
        const numAmount = Number(amount.replace?.(/,/g, '') ?? amount);
        if (numAmount > 0) {
          await adminAddPayment(booking.id, {
            paymentType: 'FINAL_PAYMENT',
            paymentMethod: paymentMethod as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE',
            amount: numAmount,
          });
        }
        await adminUpdateBookingStatus(booking.id, { status: 'COMPLETED' });
      } else if (mode === 'discount') {
        const numAmount = amount ? Number(amount.replace?.(/,/g, '') ?? amount) : undefined;
        await adminSettlementAction(booking.id, {
          action: 'complete',
          finalAmount: numAmount,
        });
      }
      toast.success(t('adminMandapam.bookings.completedToast'));
      setIsCompleteModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || t('adminMandapam.bookings.completeError'));
    }
  };

  const handleConfirmCancelDirect = async () => {
    if (!selectedBooking) return;
    try {
      await adminUpdateBookingStatus(selectedBooking.id, { status: 'CANCELLED' });
      toast.success(t('adminMandapam.bookings.cancelledToast'));
      setIsDeleteModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || t('adminMandapam.bookings.cancelError'));
    }
  };

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false);
    fetchBookings();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">
      <BookingsFilter
        t={t}
        searchQuery={searchQuery}
        setSearchQuery={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        statusFilter={statusFilter}
        setStatusFilter={(v) => { setStatusFilter(v); setCurrentPage(1); }}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        onAdd={() => setIsBookingModalOpen(true)}
      />
      <BookingsTable
        t={t}
        language={language}
        bookings={bookings}
        loading={isLoading}
        error={error}
        onRetry={fetchBookings}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onViewDetails={(b) => { setSelectedBooking(b); setIsViewDetailsModalOpen(true); }}
        onModifyPayment={(b) => { setSelectedBooking(b); setIsPaymentModalOpen(true); }}
        onComplete={(b) => { setSelectedBooking(b); setIsCompleteModalOpen(true); }}
        onCancel={(b) => { setSelectedBooking(b); setIsCancelModalOpen(true); }}
        onDelete={(b) => { setSelectedBooking(b); setIsDeleteModalOpen(true); }}
      />
      <NewBookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} t={t as any} onSuccess={handleBookingSuccess} />
      {selectedBooking && <ModifyPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} t={t} booking={selectedBooking} onConfirm={handleConfirmPayment} />}
      {selectedBooking && <CancelRefundModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} t={t} booking={selectedBooking} onConfirm={handleConfirmCancel} />}
      {selectedBooking && <CompleteBookingModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} t={t} booking={selectedBooking} onConfirm={handleConfirmComplete} />}
      {selectedBooking && <ViewDetailsModal isOpen={isViewDetailsModalOpen} onClose={() => setIsViewDetailsModalOpen(false)} t={t} booking={selectedBooking} />}
      <CancelConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmCancelDirect} booking={selectedBooking} t={t} />
    </motion.div>
  );
};

export default BookingManagement;