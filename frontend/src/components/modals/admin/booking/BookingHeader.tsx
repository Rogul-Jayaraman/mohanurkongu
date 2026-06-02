import React from 'react';
import { Calendar, Package, CalendarDays, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { BOOKING_TYPE_LABELS } from '@/constants/booking';
import type { PackageInfo } from './bookingFormTypes';

interface BookingHeaderProps {
  bookingType: string;
  packageInfo: PackageInfo | null;
  selectedDates: string[];
}

export const BookingHeader: React.FC<BookingHeaderProps> = ({ bookingType, packageInfo, selectedDates }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const hasDates = selectedDates.length > 0;

  const typeLabel = BOOKING_TYPE_LABELS[bookingType as keyof typeof BOOKING_TYPE_LABELS] || { en: bookingType, ta: bookingType };
  const isHourly = bookingType === 'HOURLY';

  const durationLabel = packageInfo?.durationType === 'FIXED_DAY'
    ? packageInfo.durationValue
      ? `${packageInfo.durationValue} Day${packageInfo.durationValue > 1 ? 's' : ''}`
      : '1 Day'
    : 'Custom Hours';

  const pricingLabel = packageInfo?.pricingType === 'HOURLY'
    ? isTamil ? 'மணிநேரம்' : 'Hourly'
    : isTamil ? 'நிலையான' : 'Fixed';

  const priceDisplay = packageInfo
    ? `₹${packageInfo.price.toLocaleString('en-IN')} (${pricingLabel})`
    : null;

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-rosewood/[0.03] to-rosewood/[0.01] rounded-xl sm:rounded-2xl border border-rosewood/10 space-y-4">
      {/* Booking type summary */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rosewood/10 flex items-center justify-center">
          {isHourly ? <Clock size={16} className="text-rosewood" /> : <Calendar size={16} className="text-rosewood" />}
        </div>
        <div>
          <p className="text-xs font-bold text-rosewood/40">
            {isTamil ? 'முன்பதிவு வகை' : 'Booking Type'}
          </p>
          <p className="text-base sm:text-lg font-black text-rosewood">
            {isTamil ? typeLabel.ta : typeLabel.en}
          </p>
        </div>
      </div>

      {/* Package & Dates */}
      {hasDates ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="px-3 sm:px-4 py-3 bg-white/60 rounded-xl border border-gold/20 space-y-1.5">
            <p className="text-[10px] font-bold text-rosewood/40">
              {isTamil ? 'தொகுப்பு' : 'Package'}
            </p>
            <p className="text-sm sm:text-base font-black text-gold">
              {isTamil ? packageInfo?.name?.ta : packageInfo?.name?.en}
            </p>
            {priceDisplay && (
              <p className="text-[11px] font-bold text-rosewood/60">{priceDisplay}</p>
            )}
            <p className="text-[10px] font-semibold text-rosewood/40">{durationLabel}</p>
          </div>
          <div className="px-3 sm:px-4 py-3 bg-white/60 rounded-xl border border-gold/20 space-y-1.5">
            <p className="text-[10px] font-bold text-rosewood/40">
              {isTamil ? 'தேதிகள்' : 'Dates'}
            </p>
            <div className="flex items-center gap-2 text-xs text-rosewood/60">
              <Package size={14} />
              <span className="font-mono font-bold break-all">
                {selectedDates.length === 1
                  ? selectedDates[0]
                  : `${selectedDates[0]} → ${selectedDates[selectedDates.length - 1]}`}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-amber/[0.03] border border-dashed border-amber/20 rounded-xl">
          <CalendarDays size={16} className="text-amber/50 shrink-0" />
          <p className="text-[10px] font-bold text-rosewood/50">
            {isTamil ? 'தேதிகள் தேர்ந்தெடுக்கப்படவில்லை' : 'No dates selected yet'}
          </p>
        </div>
      )}
    </div>
  );
};
