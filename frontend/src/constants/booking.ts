import type { BookingType } from '@/types/mandapam';

export const BOOKING_TYPE_LABELS: Record<BookingType, { en: string; ta: string }> = {
    HOURLY: { en: 'Hourly Booking', ta: 'மணிநேர முன்பதிவு' },
    ONE_DAY: { en: '1 Day Booking', ta: 'ஒரு நாள் முன்பதிவு' },
    TWO_DAY: { en: '2 Day Booking', ta: 'இரண்டு நாள் முன்பதிவு' },
};

export const BOOKING_TYPE_SHORT_LABELS: Record<BookingType, { en: string; ta: string }> = {
    HOURLY: { en: 'Hourly', ta: 'மணிநேரம்' },
    ONE_DAY: { en: '1 Day', ta: '1 நாள்' },
    TWO_DAY: { en: '2 Days', ta: '2 நாள்' },
};

export const BOOKING_STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
    CONFIRMED: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    SETTLEMENT_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const BOOKING_STATUS_FILTER_TABS: { value: string; label: string; color: string; active: string }[] = [
    { value: 'All', label: 'All', color: 'text-rosewood/50 border-transparent hover:border-gold/30 hover:text-rosewood/80', active: 'bg-rosewood text-white border-rosewood shadow-md shadow-rosewood/20' },
    { value: 'CONFIRMED', label: 'Confirmed', color: 'text-sky-600/70 border-transparent hover:border-sky-300 hover:text-sky-700', active: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-300/30' },
    { value: 'IN_PROGRESS', label: 'Ongoing', color: 'text-blue-600/70 border-transparent hover:border-blue-300 hover:text-blue-700', active: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-300/30' },
    { value: 'SETTLEMENT_PENDING', label: 'Settlement', color: 'text-amber-600/70 border-transparent hover:border-amber-300 hover:text-amber-700', active: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-300/30' },
    { value: 'COMPLETED', label: 'Completed', color: 'text-emerald-600/70 border-transparent hover:border-emerald-300 hover:text-emerald-700', active: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-300/30' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'text-rose-600/70 border-transparent hover:border-rose-300 hover:text-rose-700', active: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-300/30' },
];
