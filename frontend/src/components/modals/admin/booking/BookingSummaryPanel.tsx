import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';
import type { PackageInfo } from './bookingFormTypes';

interface BookingSummaryPanelProps {
  bookingType: string;
  packageInfo: PackageInfo | null;
  durationHours: number;
  addonIds: string[];
  addons: any[];
  addonCharge: number;
  totalCharge: number;
  advanceAmount: number;
  outstanding: number;
  bookingMethod: string;
  tokenNumber?: string;
}

export const BookingSummaryPanel: React.FC<BookingSummaryPanelProps> = ({
  bookingType, packageInfo, durationHours, addons,
  addonCharge, totalCharge, advanceAmount, outstanding,
  bookingMethod, tokenNumber, addonIds,
}) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  const selectedAddons = addons.filter((a: any) => addonIds.includes(a.id));

  return (
    <div className="bg-gradient-to-br from-rosewood/5 to-rosewood/[0.02] rounded-2xl border border-rosewood/10 p-6 space-y-4 sticky top-6">
      <p className="text-xs font-bold text-rosewood/40">
        {isTamil ? 'சுருக்கம்' : 'Summary'}
      </p>

      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-rosewood/50 font-bold">{isTamil ? 'முன்பதிவு வகை' : 'Booking Type'}</span>
          <span className="text-rosewood font-black">
            {bookingType === 'HOURLY' ? (isTamil ? 'மணிநேரம்' : 'Hourly')
              : bookingType === 'ONE_DAY' ? (isTamil ? '1 நாள்' : '1 Day')
              : (isTamil ? '2 நாள்' : '2 Day')}
          </span>
        </div>

        {packageInfo && (
          <div className="flex justify-between text-xs">
            <span className="text-rosewood/50 font-bold">{isTamil ? 'தொகுப்பு' : 'Package'}</span>
            <span className="text-rosewood font-black">
              {isTamil ? packageInfo.name.ta : packageInfo.name.en}
            </span>
          </div>
        )}

        {durationHours > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-rosewood/50 font-bold">{isTamil ? 'காலம்' : 'Duration'}</span>
            <span className="text-rosewood font-black">{durationHours} {isTamil ? 'மணி' : 'hrs'}</span>
          </div>
        )}

        {selectedAddons.length > 0 && (
          <div className="pt-2 border-t border-rosewood/10">
            <p className="text-xs font-bold text-rosewood/40 mb-2">
              {isTamil ? 'கூடுதல் சேவைகள்' : 'Selected Addons'}
            </p>
            {selectedAddons.map((a: any) => {
              const name = a.translations?.find((t: any) => t.language === (isTamil ? 'TA' : 'EN'))?.name || '';
              return (
                <div key={a.id} className="flex justify-between text-[11px] py-1">
                  <span className="text-rosewood/60 font-bold">{name}</span>
                  <span className="text-rosewood font-black">{formatCurrency(Number(a.amount))}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-rosewood/10 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-rosewood/50 font-bold">
              {bookingType === 'HOURLY'
                ? (isTamil ? 'மணிநேர கட்டணம்' : 'Hourly Rate')
                : (isTamil ? 'தொகுப்பு கட்டணம்' : 'Package Charge')}
            </span>
            <span className="text-rosewood font-black">
              {bookingType === 'HOURLY'
                ? `${formatCurrency(packageInfo?.price || 0)} × ${durationHours}${isTamil ? 'ம' : 'h'}`
                : formatCurrency(packageInfo?.price || 0)}
            </span>
          </div>
          {addonCharge > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-rosewood/50 font-bold">{isTamil ? 'கூடுதல் கட்டணம்' : 'Addon Charge'}</span>
              <span className="text-rosewood font-black">{formatCurrency(addonCharge)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-rosewood/20">
            <span className="text-rosewood font-black">{isTamil ? 'மொத்தம்' : 'Total'}</span>
            <span className="text-rosewood font-black">{formatCurrency(totalCharge)}</span>
          </div>
        </div>

        {bookingMethod === 'NORMAL_BOOKING' && advanceAmount > 0 && (
          <div className="space-y-2 pt-2 border-t border-rosewood/10">
            <div className="flex justify-between text-xs">
              <span className="text-rosewood/50 font-bold">{isTamil ? 'முன்பணம்' : 'Advance'}</span>
              <span className="text-emerald-700 font-black">- {formatCurrency(advanceAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-rosewood font-black">{isTamil ? 'மீதி' : 'Outstanding'}</span>
              <span className={`font-black ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(outstanding)}
              </span>
            </div>
          </div>
        )}

        {bookingMethod === 'TOKEN_BOOKING' && tokenNumber && (
          <div className="pt-2 border-t border-rosewood/10">
            <div className="flex justify-between text-xs">
              <span className="text-rosewood/50 font-bold">{isTamil ? 'டோக்கன்' : 'Token'}</span>
              <span className="text-rosewood font-mono font-black">{tokenNumber}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
