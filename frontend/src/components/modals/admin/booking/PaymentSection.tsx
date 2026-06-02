import React from 'react';
import { Wallet, Banknote, Smartphone, Building2, CreditCard, FileText } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BookingFormData } from './bookingFormTypes';
import { Input } from '@/components/ui/forms/Input';
import { formatCurrency } from '@/utils/format';
import { useLanguage } from '@/context/LanguageContext';

interface PaymentSectionProps {
  form: UseFormReturn<BookingFormData>;
  bookingMethod: string;
  tokenValidation: { valid: boolean; availableTokens: number } | undefined;
}

const PAYMENT_METHODS: { value: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'; labelEn: string; labelTa: string; icon: React.ComponentType<any> }[] = [
  { value: 'CASH', labelEn: 'Cash', labelTa: 'பணம்', icon: Banknote },
  { value: 'UPI', labelEn: 'UPI', labelTa: 'UPI', icon: Smartphone },
  { value: 'BANK_TRANSFER', labelEn: 'Bank Transfer', labelTa: 'வங்கி பரிமாற்றம்', icon: Building2 },
  { value: 'CARD', labelEn: 'Card', labelTa: 'அட்டை', icon: CreditCard },
  { value: 'CHEQUE', labelEn: 'Cheque', labelTa: 'காசோலை', icon: FileText },
];

export const PaymentSection: React.FC<PaymentSectionProps> = ({ form, bookingMethod, tokenValidation }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const advanceAmount = form.watch('advanceAmount') || 0;

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-rosewood/40" />
          <p className="text-xs font-bold text-rosewood/40">
            {isTamil ? 'கட்டணம்' : 'Payment'}
            {bookingMethod === 'TOKEN_BOOKING' && (
              <span className="text-[9px] text-rosewood/50 font-bold ml-1.5">
                ({isTamil ? 'கூடுதல் சேவைகளுக்கு' : 'For Addons'})
              </span>
            )}
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <Input
              label={isTamil ? 'முன்பணம்' : 'Advance Amount'}
              icon="payments"
              name="advanceAmount"
              type="text"
              inputMode="numeric"
              value={advanceAmount > 0 ? advanceAmount.toLocaleString('en-IN') : ''}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                const numVal = val !== '' ? parseInt(val) : 0;
                form.setValue('advanceAmount', numVal);
              }}
              placeholder="0"
            />
            {advanceAmount > 0 && (
              <div className="px-4 py-3 bg-gold/5 border border-gold/10 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-[0.06] group-hover:scale-110 transition-transform pointer-events-none">
                  <Wallet size={32} />
                </div>
                <span className="text-[10px] font-black text-rosewood/40 block mb-0.5 relative z-10">
                  {isTamil ? 'முன்பண தொகை' : 'Advance Amount'}
                </span>
                <span className="text-sm font-black text-rosewood relative z-10">{formatCurrency(advanceAmount)}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-rosewood/50 ml-1">
              {isTamil ? 'கட்டண முறை' : 'Payment Method'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(pm => {
                const isActive = form.watch('paymentMethod') === pm.value;
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => form.setValue('paymentMethod', pm.value)}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all ${
                      isActive
                        ? 'bg-rosewood border-rosewood text-white shadow-lg shadow-rosewood/20'
                        : 'bg-white border-rosewood/10 text-rosewood/60 hover:border-gold/30 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-center mb-1.5">
                      <Icon size={18} />
                    </div>
                    <p className="font-black text-xs">{isTamil ? pm.labelTa : pm.labelEn}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
    </div>
  );
};
