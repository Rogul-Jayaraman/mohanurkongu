export const getBookingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'confirmed':
            return 'bg-sky-100 text-sky-800 ring-sky-200';
        case 'event_in_progress':
            return 'bg-blue-100 text-blue-800 ring-blue-200';
        case 'event_completed':
            return 'bg-indigo-100 text-indigo-800 ring-indigo-200';
        case 'settlement_pending':
            return 'bg-amber-100 text-amber-800 ring-amber-200';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
        case 'cancelled':
            return 'bg-rose-100 text-rose-800 ring-rose-200';
        default:
            return 'bg-gray-100 text-gray-700 ring-gray-200';
    }
};

export function getPaymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'fully_paid':
            return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
        case 'advance':
            return 'bg-amber-100 text-amber-800 ring-amber-200';
        case 'refunded':
            return 'bg-rose-100 text-rose-800 ring-rose-200';
        case 'not_paid':
        default:
            return 'bg-gray-100 text-gray-700 ring-gray-200';
    }
}

export function getComputedPaymentStatus(booking: {
  ledgerEntries?: { amount: number }[];
  paymentEntries?: { amount: number }[];
  refundEntries?: { amount: number }[];
}): string {
  const charges = (booking.ledgerEntries || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);
  const payments = (booking.paymentEntries || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);
  const refunds = (booking.refundEntries || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);
  if (payments === 0 && refunds === 0) return 'not_paid';
  if (payments - refunds >= charges) return 'fully_paid';
  if (payments > 0) return 'advance';
  return 'not_paid';
}
