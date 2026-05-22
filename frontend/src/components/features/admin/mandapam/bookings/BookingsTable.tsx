import React from 'react';
import { CheckCircle2, XCircle, CreditCard, Eye, CalendarX, Trash2 } from 'lucide-react';
import type { MandapamBooking } from '@/services/mandapamService';
import { TableActionDropdown } from '@/components/ui/table/TableActionDropdown';
import { DataTable, Column } from '@/components/ui/table/DataTable';
import { format } from 'date-fns';
import { ta } from 'date-fns/locale';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { useLanguage } from '@/context/LanguageContext';

interface BookingsTableProps {
    t: any;
    filteredBookings: MandapamBooking[];
    handleCompleteBooking: (booking: MandapamBooking) => void;
    handleModifyPayment: (booking: MandapamBooking) => void;
    handleCancelBooking: (booking: MandapamBooking) => void;
    handleDeleteBooking: (booking: MandapamBooking) => void;
    handleViewDetails: (booking: MandapamBooking) => void;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
    t, filteredBookings, handleCompleteBooking, handleModifyPayment, handleCancelBooking, handleDeleteBooking, handleViewDetails,
    currentPage, totalPages, totalItems, itemsPerPage, onPageChange,
    loading = false, error = null, onRetry
}) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    // Helper to determine if booking can be modified
    const isActionable = (status?: string) => !status || status === 'UPCOMING';

    const actions = (booking: MandapamBooking) => [
        {
            label: t('adminMandapam.bookings.viewDetails') || 'View Details',
            icon: Eye,
            onClick: () => handleViewDetails(booking)
        },
        {
            label: t('adminMandapam.bookings.completeBookingTitle') || 'Mark Completed',
            icon: CheckCircle2,
            onClick: () => handleCompleteBooking(booking),
            show: isActionable(booking.status)
        },
        {
            label: t('adminMandapam.bookings.updatePayment') || 'Modify Payment',
            icon: CreditCard,
            onClick: () => handleModifyPayment(booking),
            show: isActionable(booking.status) && booking.paymentStatus !== 'FULLY_PAID'
        },
        {
            label: t('adminMandapam.bookings.cancelBookingTitle') || 'Cancel Booking',
            icon: XCircle,
            onClick: () => handleCancelBooking(booking),
            show: isActionable(booking.status),
            danger: true
        },
        {
            label: t('common.delete') || 'Delete Permanently',
            icon: Trash2,
            onClick: () => handleDeleteBooking(booking),
            danger: true
        }
    ];

    const getPaymentLabel = (status: string) => {
        return status === 'FULLY_PAID' ? t('adminMandapam.bookings.fullyPaid') : 
               status === 'ADVANCE' ? t('adminMandapam.bookings.currentAdvance') : 
               status === 'NOT_PAID' ? t('adminMandapam.bookings.notPaid') :
               status.replace('_', ' ');
    };

    const paymentStatusMap: Record<string, any> = {
        'FULLY_PAID': 'approved',
        'ADVANCE': 'pending',
        'NOT_PAID': 'rejected'
    };

    const columns: Column<MandapamBooking>[] = [
        {
            header: t('adminMandapam.bookings.bookingId') || 'Booking ID',
            render: (booking) => (
                <span className="text-xs text-gold font-bold">
                    {booking.eventId}
                </span>
            )
        },
        {
            header: t('adminMandapam.bookings.eventDetails') || 'Event Details',
            render: (booking) => {
                const title = isTamil ? booking.eventTitleTa : booking.eventTitleEn;
                return (
                    <div className="font-semibold text-rosewood text-sm truncate max-w-48" title={title}>
                        {title}
                    </div>
                );
            }
        },
        {
            header: t('adminMandapam.bookings.clientName') || 'Client',
            render: (booking) => (
                <div className="text-sm text-slate-700 font-medium">
                    {isTamil ? booking.contactNameTa : booking.contactNameEn}
                </div>
            )
        },
        {
            header: t('adminMandapam.bookings.dateSession') || 'Date & Session',
            render: (booking) => (
                <div className="text-sm text-slate-700">
                    <div className="font-medium">
                        {format(new Date(booking.date), 'dd MMM yyyy', { locale: isTamil ? ta : undefined })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {booking.session === 'MORNING' ? t('adminMandapam.bookings.morning') : 
                         booking.session === 'EVENING' ? t('adminMandapam.bookings.evening') : 
                         t('adminMandapam.bookings.fullDay')}
                    </div>
                </div>
            )
        },
        {
            header: t('adminMandapam.bookings.package') || 'Package',
            render: (booking) => (
                <div className="text-sm">
                    <div className="font-medium text-slate-700">
                        {isTamil ? booking.packageNameTa : booking.packageNameEn}
                    </div>
                    <div className="text-xs text-gold font-semibold">₹{booking.packageSnapshotPrice.toLocaleString()}</div>
                </div>
            )
        },
        {
            header: t('adminMandapam.bookings.status') || 'Status',
            render: (booking) => (
                <StatusBadge status={(booking.status || 'UPCOMING').toLowerCase() as any} minimal />
            )
        },
        {
            header: t('adminMandapam.bookings.payment') || 'Payment',
            render: (booking) => (
                <StatusBadge 
                    status={paymentStatusMap[booking.paymentStatus]} 
                    label={getPaymentLabel(booking.paymentStatus)}
                    minimal
                />
            )
        },
        {
            header: t('adminMandapam.bookings.actions') || 'Actions',
            headerClassName: 'w-20 text-center',
            className: 'text-center',
            render: (booking) => (
                <TableActionDropdown items={actions(booking)} />
            )
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={filteredBookings}
            loading={loading}
            error={error}
            onRetry={onRetry}
            pagination={{
                currentPage,
                totalPages,
                totalItems,
                itemsPerPage,
                onPageChange
            }}
            emptyState={{
                icon: CalendarX,
                title: t('adminMandapam.bookings.noBookingsFound') || 'No bookings found matching your criteria.',
                description: t('adminMandapam.bookings.noBookingsDesc') || "There are no hall bookings matching your search or filters at the moment."
            }}
        />
    );
};
