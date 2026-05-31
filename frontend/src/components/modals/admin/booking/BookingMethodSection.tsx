import React from 'react';
import { UserCheck, Ticket } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BookingFormData } from './bookingFormTypes';
import { useLanguage } from '@/context/LanguageContext';

interface BookingMethodSectionProps {
  form: UseFormReturn<BookingFormData>;
}

export const BookingMethodSection: React.FC<BookingMethodSectionProps> = ({ form }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const bookingMethod = form.watch('bookingMethod');

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-rosewood/40">
        {isTamil ? 'முன்பதிவு முறை' : 'Booking Method'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => form.setValue('bookingMethod', 'NORMAL_BOOKING', { shouldValidate: true })}
          className={`p-4 rounded-2xl border-2 text-left transition-all ${
            bookingMethod === 'NORMAL_BOOKING'
              ? 'bg-rosewood border-rosewood text-white shadow-lg'
              : 'bg-white border-rosewood/10 text-rosewood hover:border-gold/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              bookingMethod === 'NORMAL_BOOKING' ? 'bg-white/20' : 'bg-rosewood/5'
            }`}>
              <UserCheck size={20} />
            </div>
            <div>
              <p className="font-black text-sm">{isTamil ? 'நேரடி முன்பதிவு' : 'Normal Booking'}</p>
              <p className={`text-xs font-bold ${
                bookingMethod === 'NORMAL_BOOKING' ? 'text-white/60' : 'text-rosewood/40'
              }`}>
                {isTamil ? 'பணம் செலுத்தி முன்பதிவு' : 'Pay & Book'}
              </p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => form.setValue('bookingMethod', 'TOKEN_BOOKING', { shouldValidate: true })}
          className={`p-4 rounded-2xl border-2 text-left transition-all ${
            bookingMethod === 'TOKEN_BOOKING'
              ? 'bg-rosewood border-rosewood text-white shadow-lg'
              : 'bg-white border-rosewood/10 text-rosewood hover:border-gold/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              bookingMethod === 'TOKEN_BOOKING' ? 'bg-white/20' : 'bg-rosewood/5'
            }`}>
              <Ticket size={20} />
            </div>
            <div>
              <p className="font-black text-sm">{isTamil ? 'டோக்கன் முன்பதிவு' : 'Token Booking'}</p>
              <p className={`text-xs font-bold ${
                bookingMethod === 'TOKEN_BOOKING' ? 'text-white/60' : 'text-rosewood/40'
              }`}>
                {isTamil ? 'டோக்கன் பயன்படுத்தி முன்பதிவு' : 'Use Token'}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
