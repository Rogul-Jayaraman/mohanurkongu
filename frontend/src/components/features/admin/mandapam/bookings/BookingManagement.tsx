import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { stubFetchBookings, stubUpdateBooking, stubAddPayment, stubDeleteBooking } from '@/utils/stubs';
import { NewBookingModal } from '@/modals/admin/NewBookingModal';
import { CancelRefundModal } from '@/modals/admin/CancelRefundModal';
import { CompleteBookingModal } from '@/modals/admin/CompleteBookingModal';
import { ModifyPaymentModal } from '@/modals/admin/ModifyPaymentModal';
import { ViewDetailsModal } from '@/modals/admin/ViewDetailsModal';
import { DeleteConfirmationModal } from '@/modals/admin/DeleteConfirmationModal';
import { BookingsFilter } from '@/components/features/admin/mandapam/bookings/BookingsFilter';
import { BookingsTable } from '@/components/features/admin/mandapam/bookings/BookingsTable';
import type { MandapamBooking } from '@/types/admin-types';
import { toast } from 'sonner';

// BookingManagement (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const BookingManagement: React.FC = () => {
    const { t } = useLanguage();
    const isTamil = t('common.language') === 'ta';
    const [selectedBooking, setSelectedBooking] = React.useState<MandapamBooking | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('All');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = React.useState(false);
    const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

    const [qBookings, setQBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const refetch = () => { setIsLoading(true); stubFetchBookings({ search: searchQuery, status: statusFilter }).then(setQBookings).catch(setError).finally(() => setIsLoading(false)); };
    useEffect(() => { refetch(); }, [searchQuery, statusFilter]);

    const paginationData = React.useMemo(() => {
        const totalItems = qBookings.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        return { paginatedBookings: qBookings.slice(startIndex, startIndex + itemsPerPage), totalItems, totalPages };
    }, [qBookings, currentPage, itemsPerPage]);

    const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [isDeletingBooking, setIsDeletingBooking] = useState(false);

    const handleConfirmPayment = (booking: MandapamBooking, paymentType: string, amount: string) => {
        const numAmount = Number(amount.replace?.(/,/g, '') ?? amount);
        if (paymentType === 'paid') {
            setIsUpdatingBooking(true);
            stubUpdateBooking({ id: booking.id, data: { paymentStatus: 'FULLY_PAID', paidAmount: booking.totalAmount, balance: 0 } }).then(
                () => { toast.success('Booking fully settled'); setIsPaymentModalOpen(false); }
            ).catch(
                (err: any) => toast.error(err.message || 'Failed to update payment')
            ).finally(() => setIsUpdatingBooking(false));
        } else {
            setIsAddingPayment(true);
            stubAddPayment({ bookingId: booking.id, data: { amount: numAmount, paymentMethod: 'CASH' } }).then(
                () => { toast.success('Payment added'); setIsPaymentModalOpen(false); }
            ).catch(
                (err: any) => toast.error(err.message || 'Failed to add payment')
            ).finally(() => setIsAddingPayment(false));
        }
    };

    const handleConfirmCancel = (booking: MandapamBooking, refundType: string, refundAmount: string) => {
        const data: any = { status: 'CANCELLED' };
        if (refundType === 'full') {
            data.paidAmount = 0;
            data.balance = booking.totalAmount;
            data.paymentStatus = 'NOT_PAID';
        } else if (refundType === 'advance') {
            data.paidAmount = 0;
            data.balance = booking.totalAmount;
            data.paymentStatus = 'NOT_PAID';
        } else if (refundType === 'partial' && refundAmount) {
            const refund = Number(refundAmount.replace?.(/,/g, '') ?? refundAmount);
            data.paidAmount = Math.max(0, booking.paidAmount - refund);
            data.balance = booking.totalAmount - data.paidAmount;
        }
        setIsUpdatingBooking(true);
        stubUpdateBooking({ id: booking.id, data }).then(
            () => { toast.success('Booking cancelled'); setIsCancelModalOpen(false); }
        ).catch(
            (err: any) => toast.error(err.message || 'Failed to cancel booking')
        ).finally(() => setIsUpdatingBooking(false));
    };

    const handleConfirmComplete = (booking: MandapamBooking, paymentStatus: string, amount: string) => {
        const data: any = { status: 'COMPLETED' };
        if (paymentStatus === 'discounted' && amount) {
            const discount = Number(amount.replace?.(/,/g, '') ?? amount);
            data.totalAmount = booking.totalAmount - discount;
            data.paidAmount = data.totalAmount;
            data.balance = 0;
            data.paymentStatus = 'FULLY_PAID';
        } else if (booking.balance > 0) {
            data.paidAmount = booking.totalAmount;
            data.balance = 0;
            data.paymentStatus = 'FULLY_PAID';
        }
        setIsUpdatingBooking(true);
        stubUpdateBooking({ id: booking.id, data }).then(
            () => { toast.success('Booking completed'); setIsCompleteModalOpen(false); }
        ).catch(
            (err: any) => toast.error(err.message || 'Failed to complete booking')
        ).finally(() => setIsUpdatingBooking(false));
    };

    const handleConfirmDelete = () => {
        if (!selectedBooking) return;
        setIsDeletingBooking(true);
        stubDeleteBooking(selectedBooking.id).then(
            () => { toast.success('Booking deleted permanently'); setIsDeleteModalOpen(false); refetch(); }
        ).catch(
            (err: any) => toast.error(err.message || 'Failed to delete booking')
        ).finally(() => setIsDeletingBooking(false));
    };

    const handleBookingSuccess = () => { setIsBookingModalOpen(false); refetch(); };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">
            <BookingsFilter 
                t={t} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                statusFilter={statusFilter} 
                setStatusFilter={setStatusFilter} 
                isFilterOpen={isFilterOpen} 
                setIsFilterOpen={setIsFilterOpen} 
                onAdd={() => setIsBookingModalOpen(true)}
            />
            <BookingsTable t={t} filteredBookings={paginationData.paginatedBookings} handleCompleteBooking={(b) => { setSelectedBooking(b); setIsCompleteModalOpen(true); }} handleModifyPayment={(b) => { setSelectedBooking(b); setIsPaymentModalOpen(true); }} handleCancelBooking={(b) => { setSelectedBooking(b); setIsCancelModalOpen(true); }} handleDeleteBooking={(b) => { setSelectedBooking(b); setIsDeleteModalOpen(true); }} handleViewDetails={(b) => { setSelectedBooking(b); setIsViewDetailsModalOpen(true); }} currentPage={currentPage} totalPages={paginationData.totalPages} totalItems={paginationData.totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} loading={isLoading} error={error?.message} onRetry={() => refetch()} />
            <NewBookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} t={t as any} onSuccess={handleBookingSuccess} />
            {selectedBooking && <ModifyPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} t={t} booking={selectedBooking as any} onConfirm={handleConfirmPayment as any} />}
            {selectedBooking && <CancelRefundModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} t={t} booking={selectedBooking as any} onConfirm={handleConfirmCancel as any} />}
            {selectedBooking && <CompleteBookingModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} t={t} booking={selectedBooking as any} onConfirm={handleConfirmComplete as any} />}
            {selectedBooking && <ViewDetailsModal isOpen={isViewDetailsModalOpen} onClose={() => setIsViewDetailsModalOpen(false)} t={t} booking={selectedBooking as any} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} booking={selectedBooking} t={t} />
        </motion.div>
    );
};

export default BookingManagement;
