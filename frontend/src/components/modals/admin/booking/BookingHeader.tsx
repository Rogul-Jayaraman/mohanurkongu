import React from 'react';
import { Calendar, Package, Clock, Sun, Sunset } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { PackageInfo } from './bookingFormTypes';
import type { BookingType } from '@/types/mandapam';

interface BookingHeaderProps {
  bookingType: string;
  packageInfo: PackageInfo | null;
  selectedDates: string[];
  onBookingTypeChange?: (type: BookingType) => void;
}

const BOOKING_TYPE_OPTIONS: { value: BookingType; icon: React.ReactNode; labelEn: string; labelTa: string; descEn: string; descTa: string }[] = [
  { value: 'HOURLY', icon: <Clock size={20} />, labelEn: 'Hourly', labelTa: 'மணிநேரம்', descEn: 'Pay by the hour', descTa: 'மணி கணக்கில் கட்டணம்' },
  { value: 'ONE_DAY', icon: <Sun size={20} />, labelEn: '1 Day', labelTa: '1 நாள்', descEn: 'Full day event', descTa: 'முழு நாள் நிகழ்வு' },
  { value: 'TWO_DAY', icon: <Sunset size={20} />, labelEn: '2 Day', labelTa: '2 நாள்', descEn: 'Two day event', descTa: 'இரண்டு நாள் நிகழ்வு' },
];

export const BookingHeader: React.FC<BookingHeaderProps> = ({ bookingType, packageInfo, selectedDates, onBookingTypeChange }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  if (!selectedDates.length && onBookingTypeChange) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-bold text-rosewood/40">
          {isTamil ? 'முன்பதிவு வகையைத் தேர்ந்தெடுக்கவும்' : 'Select Booking Type'}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {BOOKING_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onBookingTypeChange(opt.value)}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                bookingType === opt.value
                  ? 'bg-rosewood border-rosewood text-white shadow-lg'
                  : 'bg-white border-rosewood/10 text-rosewood hover:border-gold/30'
              }`}
            >
              <div className="flex justify-center mb-2">{opt.icon}</div>
              <p className="font-black text-sm">{isTamil ? opt.labelTa : opt.labelEn}</p>
              <p className={`text-[9px] font-bold mt-1 ${
                bookingType === opt.value ? 'text-white/60' : 'text-rosewood/40'
              }`}>
                {isTamil ? opt.descTa : opt.descEn}
              </p>
            </button>
          ))}
        </div>
        {packageInfo && (
          <div className="px-4 py-3 bg-gold/5 rounded-xl border border-gold/20 flex items-center justify-between">
            <span className="text-[10px] font-bold text-rosewood/50">{isTamil ? 'தேர்ந்தெடுக்கப்பட்ட தொகுப்பு' : 'Selected Package'}</span>
            <span className="text-sm font-black text-gold">{isTamil ? packageInfo.name.ta : packageInfo.name.en}</span>
          </div>
        )}
      </div>
    );
  }

  const typeLabel = {
    HOURLY: isTamil ? 'மணிநேர முன்பதிவு' : 'Hourly Booking',
    ONE_DAY: isTamil ? 'ஒரு நாள் முன்பதிவு' : '1 Day Booking',
    TWO_DAY: isTamil ? 'இரண்டு நாள் முன்பதிவு' : '2 Day Booking',
  }[bookingType] || bookingType;

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
    <div className="p-6 bg-gradient-to-br from-rosewood/[0.03] to-rosewood/[0.01] rounded-2xl border border-rosewood/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rosewood/10 flex items-center justify-center">
            <Calendar size={18} className="text-rosewood" />
          </div>
          <div>
            <p className="text-xs font-bold text-rosewood/40">
              {isTamil ? 'முன்பதிவு வகை' : 'Booking Type'}
            </p>
            <p className="text-lg font-black text-rosewood">{typeLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="px-4 py-3 bg-gold/5 rounded-xl border border-gold/20 space-y-2">
          <p className="text-xs font-bold text-rosewood/40">
            {isTamil ? 'தொகுப்பு' : 'Package'}
          </p>
          <p className="text-base font-black text-gold">
            {isTamil ? packageInfo?.name?.ta : packageInfo?.name?.en}
          </p>
          {priceDisplay && (
            <p className="text-[11px] font-bold text-rosewood/60">{priceDisplay}</p>
          )}
          <p className="text-[10px] font-semibold text-rosewood/40">
            {durationLabel}
          </p>
        </div>
        <div className="px-4 py-3 bg-rosewood/[0.03] rounded-xl border border-rosewood/10 space-y-2">
          <p className="text-xs font-bold text-rosewood/40">
            {isTamil ? 'தேதிகள்' : 'Dates'}
          </p>
          <div className="flex items-center gap-2 text-xs text-rosewood/60">
            <Package size={14} />
            <span className="font-mono font-bold">
              {selectedDates.length === 1
                ? selectedDates[0]
                : `${selectedDates[0]} → ${selectedDates[selectedDates.length - 1]}`}
            </span>
          </div>
        </div>
      </div>


    </div>
  );
};
