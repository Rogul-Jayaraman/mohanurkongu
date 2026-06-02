import React from 'react';
import { PackagePlus, Minus, Plus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BookingFormData } from './bookingFormTypes';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/utils/format';

interface AddonSectionProps {
  form: UseFormReturn<BookingFormData>;
  addons: any[];
}

export const AddonSection: React.FC<AddonSectionProps> = ({ form, addons }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const selectedAddonIds = form.watch('addonIds') || [];
  const addonAmounts = form.watch('addonAmounts') || {};
  const addonQuantities = form.watch('addonQuantities') || {};
  const addonUnits = form.watch('addonUnits') || {};

  const toggleAddon = (addonId: string) => {
    const current = form.watch('addonIds') || [];
    const next = current.includes(addonId)
      ? current.filter(id => id !== addonId)
      : [...current, addonId];
    form.setValue('addonIds', next);

    const amounts = form.getValues('addonAmounts') || {};
    const qties = form.getValues('addonQuantities') || {};
    const units = form.getValues('addonUnits') || {};

    if (!current.includes(addonId)) {
      form.setValue('addonAmounts', { ...amounts, [addonId]: 0 });
      form.setValue('addonQuantities', { ...qties, [addonId]: 1 });
      form.setValue('addonUnits', { ...units, [addonId]: 1 });
    } else {
      delete amounts[addonId];
      delete qties[addonId];
      delete units[addonId];
      form.setValue('addonAmounts', amounts);
      form.setValue('addonQuantities', qties);
      form.setValue('addonUnits', units);
    }
  };

  const setAmount = (addonId: string, val: number) => {
    form.setValue('addonAmounts', { ...form.getValues('addonAmounts'), [addonId]: Math.max(0, val) });
  };

  const setQuantity = (addonId: string, val: number) => {
    form.setValue('addonQuantities', { ...form.getValues('addonQuantities'), [addonId]: Math.max(1, val) });
  };

  const setUnits = (addonId: string, val: number) => {
    form.setValue('addonUnits', { ...form.getValues('addonUnits'), [addonId]: Math.max(1, val) });
  };

  const pricingLabel = (type: string) => {
    if (type === 'PER_EVENT') return isTamil ? 'ஒரு நிகழ்வு' : 'Per Event';
    if (type === 'PER_HOUR') return isTamil ? 'மணி நேரம்' : 'Per Hour';
    if (type === 'PER_DAY') return isTamil ? 'நாள்' : 'Per Day';
    return '';
  };

  const pricingShortLabel = (type: string) => {
    if (type === 'PER_EVENT') return isTamil ? '/ நிகழ்வு' : '/event';
    if (type === 'PER_HOUR') return isTamil ? '/ மணி' : '/hr';
    if (type === 'PER_DAY') return isTamil ? '/ நாள்' : '/day';
    return '';
  };

  const computeLineTotal = (addon: any, id: string) => {
    const price = addonAmounts?.[id] ?? 0;
    const qty = addonQuantities?.[id] ?? 1;
    const unitCount = addonUnits?.[id] ?? 1;
    return price * qty * unitCount;
  };

  if (!addons.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PackagePlus size={16} className="text-rosewood/40" />
        <p className="text-xs font-bold text-rosewood/40">
          {isTamil ? 'கூடுதல் சேவைகள்' : 'Addons'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {addons.map((addon: any) => {
          const isSelected = selectedAddonIds.includes(addon.id);
          const nameEn = addon.translations?.find((t: any) => t.language === 'EN')?.name || '';
          const nameTa = addon.translations?.find((t: any) => t.language === 'TA')?.name || '';
          const addonType = addon.pricingType || 'PER_EVENT';
          const lineTotal = computeLineTotal(addon, addon.id);

          return (
            <div
              key={addon.id}
              className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-rosewood border-rosewood text-white shadow-lg'
                  : 'bg-white border-rosewood/10 text-rosewood hover:border-gold/30'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAddon(addon.id)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20' : 'bg-rosewood/5'
                    }`}>
                      <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-white' : 'text-rosewood'}`}>{addon.iconName || 'add'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{isTamil ? nameTa || nameEn : nameEn || nameTa}{nameEn && nameTa && <span className="font-normal text-[10px] opacity-60 ml-1">({isTamil ? nameEn : nameTa})</span>}</p>
                      <p className={`text-[10px] font-bold ${isSelected ? 'text-white/60' : 'text-rosewood/40'}`}>
                        {pricingLabel(addonType)}
                        {addon.supportsQuantity && <span className="ml-1.5 opacity-70">· {isTamil ? 'அளவு' : 'Qty'}</span>}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {isSelected && (
                <div className="relative z-10 mt-3 pt-3 border-t border-white/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/60 whitespace-nowrap">
                      {isTamil ? 'விலை' : 'Price'}
                      {pricingShortLabel(addonType)}
                    </span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-bold">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={addonAmounts?.[addon.id] ?? ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!addonAmounts?.[addon.id]) {
                            (e.target as HTMLInputElement).select();
                          }
                        }}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAmount(addon.id, v === '' ? 0 : parseFloat(v));
                        }}
                        className="w-full pl-5 pr-2 py-1.5 text-xs font-black bg-white/15 rounded-lg border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {addon.supportsQuantity && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white/60">
                        {isTamil ? 'அளவு' : 'Qty'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setQuantity(addon.id, (addonQuantities?.[addon.id] || 1) - 1); }}
                          disabled={(addonQuantities?.[addon.id] || 1) <= 1}
                          className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all disabled:opacity-30"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-sm font-black w-6 text-center">{addonQuantities?.[addon.id] || 1}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setQuantity(addon.id, (addonQuantities?.[addon.id] || 1) + 1); }}
                          className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  )}

                  {(addonType === 'PER_HOUR' || addonType === 'PER_DAY') && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white/60">
                        {addonType === 'PER_HOUR' ? (isTamil ? 'மணி' : 'Hours') : (isTamil ? 'நாட்கள்' : 'Days')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUnits(addon.id, (addonUnits?.[addon.id] || 1) - 1); }}
                          disabled={(addonUnits?.[addon.id] || 1) <= 1}
                          className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all disabled:opacity-30"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-sm font-black w-6 text-center">{addonUnits?.[addon.id] || 1}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUnits(addon.id, (addonUnits?.[addon.id] || 1) + 1); }}
                          className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  )}

                  {lineTotal > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/15">
                      <span className="text-[10px] font-bold text-white/50">
                        {isTamil ? 'மொத்தம்' : 'Line Total'}
                      </span>
                      <span className="text-sm font-black text-white">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};