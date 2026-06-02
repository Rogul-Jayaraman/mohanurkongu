export const BOOKING_STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  CONFIRMED: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  EVENT_IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  EVENT_COMPLETED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  SETTLEMENT_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export function getBookingStatusStyle(status: string): { bg: string; text: string; border: string } {
  return BOOKING_STATUS_STYLE[status] || BOOKING_STATUS_STYLE.CONFIRMED;
}

export function getBookingStatusColor(status: string): string {
  const s = getBookingStatusStyle(status);
  return `${s.bg} ${s.text} ring-1 ${s.border}`;
}

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

export function getBookingPaymentStatus(booking: {
  ledgerEntries?: { amount: number }[];
  paymentEntries?: { amount: number }[];
  refundEntries?: { amount: number }[];
}): { status: string; label: string; color: string; bg: string; outstanding: number } {
  const charges = (booking.ledgerEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  const payments = (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  const refunds = (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  const outstanding = charges - payments + refunds;

  if (payments === 0 && refunds === 0) return { status: 'not_paid', label: 'Not Paid', color: 'text-rose-600', bg: 'bg-rose-50', outstanding };
  if (payments - refunds >= charges || outstanding <= 0) return { status: 'fully_paid', label: 'Fully Paid', color: 'text-emerald-700', bg: 'bg-emerald-50', outstanding };
  return { status: 'advance', label: 'Advance Paid', color: 'text-amber-700', bg: 'bg-amber-50', outstanding };
}

export function getComputedPaymentStatus(booking: {
  ledgerEntries?: { amount: number }[];
  paymentEntries?: { amount: number }[];
  refundEntries?: { amount: number }[];
}): string {
  const payments = (booking.paymentEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  const refunds = (booking.refundEntries || []).reduce((s, e) => s + Number(e.amount), 0);
  if (payments === 0 && refunds === 0) return 'not_paid';
  return getBookingPaymentStatus(booking).status;
}
