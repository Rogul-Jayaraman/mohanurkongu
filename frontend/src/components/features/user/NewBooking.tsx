import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarDays, PackagePlus, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useScrollToTop } from '../../ui/layout/ScrollToTop';
import { Spinner } from '../../ui/feedback/Spinner';
import { formatCurrency } from '../../../utils/format';
import { useLanguage } from '../../../context/LanguageContext';
import { useBookingForm } from '../../modals/admin/booking/useBookingForm';
import { useCreateBooking } from '../../../queries/useMandapamMutations';
import type { BookingType, BookingMethod } from '../../../types/mandapam';
import { DISTRICT_TAMIL, TALUK_TAMIL } from '../../../constants/locations';
import { BOOKING_TYPE_SHORT_LABELS } from '../../../constants/booking';

import { CustomerEventSection } from '../../modals/admin/booking/CustomerEventSection';
import { AddonSection } from '../../modals/admin/booking/AddonSection';
import { PaymentSection } from '../../modals/admin/booking/PaymentSection';
import { BookingMethodSection } from '../../modals/admin/booking/BookingMethodSection';
import { TimeConfigurationSection } from '../../modals/admin/booking/TimeConfigurationSection';
import type { CalendarEntryInfo } from '../../modals/admin/booking/bookingFormTypes';

const STEPS = [
  { labelEn: 'Type & Booking', labelTa: 'வகை மற்றும் முன்பதிவு' },
  { labelEn: 'Customer & Event', labelTa: 'வாடிக்கையாளர் மற்றும் நிகழ்வு' },
  { labelEn: 'Addons & Payment', labelTa: 'கூடுதல் மற்றும் கட்டணம்' },
  { labelEn: 'Review', labelTa: 'மதிப்பாய்வு' },
];

const HOURLY_LABEL = { en: 'Type & Time', ta: 'வகை மற்றும் நேரம்' };

const NewBooking: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext<{ setHeaderContent?: (content: React.ReactNode) => void }>();

  const locationState = location.state as { bookingType?: BookingType; dates?: string[]; existingEntries?: CalendarEntryInfo[] } | undefined;
  const isPreselected = !!locationState?.bookingType;

  const [bookingType, setBookingType] = useState<BookingType>(locationState?.bookingType || 'ONE_DAY');
  const [selectedDates, setSelectedDates] = useState<string[]>(locationState?.dates || []);
  const [existingEntries] = useState<CalendarEntryInfo[]>(locationState?.existingEntries || []);
  const [currentStep, setCurrentStep] = useState(0);
  const createBooking = useCreateBooking();
  const isSubmitting = createBooking.isPending;
  const [date1, setDate1] = useState(locationState?.dates?.[0] || '');
  const [date2, setDate2] = useState(locationState?.dates?.[1] || '');

  const { form, packageInfo, addons, durationHours, addonCharge, totalCharge, advanceAmount, outstanding, tokenValidation, bookingMethod, tokenNumber, addonAmounts, addonQuantities, addonUnits, startTime, endTime } = useBookingForm(bookingType, selectedDates);

  const tokenNumValue = parseInt(form.watch('tokenNumber')?.replace(/^MK/, '') || '0', 10);
  const tokenNum2Value = parseInt(form.watch('tokenNumber2')?.replace(/^MK/, '') || '0', 10);
  const isTokenValid = tokenNumValue >= 1 && tokenNumValue <= 6000 && (tokenValidation?.valid ?? true);
  const isToken2Valid = tokenNum2Value >= 1 && tokenNum2Value <= 6000;
  const areTokensDistinct = form.watch('tokenNumber') !== form.watch('tokenNumber2') || !form.watch('tokenNumber2');

  useScrollToTop([currentStep]);

  const totalSteps = STEPS.length;

  useEffect(() => {
    if (!outletContext?.setHeaderContent) return;
    const stepLabel = bookingType === 'HOURLY'
      ? (isTamil ? HOURLY_LABEL.ta : HOURLY_LABEL.en)
      : (isTamil ? STEPS[0].labelTa : STEPS[0].labelEn);
    outletContext.setHeaderContent(
      <div className="flex flex-col gap-0.5 min-w-[200px]">
        <h2 className="text-sm md:text-base font-serif font-bold text-rosewood leading-tight truncate">
          {isTamil ? 'புதிய முன்பதிவு' : 'New Booking'}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-rosewood/60 whitespace-nowrap">
            {isTamil ? `படி ${currentStep + 1}/${totalSteps}` : `Step ${currentStep + 1}/${totalSteps}`}
          </span>
          <div className="flex-1 h-0.5 bg-gold-soft/30 rounded-full overflow-hidden max-w-[120px]">
            <div className="h-full bg-rosewood rounded-full transition-all duration-700"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>
    );
    return () => outletContext.setHeaderContent?.(null);
  }, [currentStep, outletContext, isTamil, bookingType]);

  const selectedAddonIds = form.watch('addonIds') || [];
  const selectedAddons = useMemo(() => addons.filter((a: any) => selectedAddonIds.includes(a.id)), [addons, selectedAddonIds]);

  const validateStep1 = async () => {
    const valid = await form.trigger(['contactName.en', 'phone', 'eventName.en'] as any);
    if (!valid) { toast.error(isTamil ? 'தேவையான புலங்களை நிரப்பவும்' : 'Please fill required fields'); return false; }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (bookingType === 'HOURLY') {
        const st = form.getValues('startTime');
        const et = form.getValues('endTime');
        if (!st || !et) {
          toast.error(isTamil ? 'தொடக்க மற்றும் முடிவு நேரத்தைத் தேர்ந்தெடுக்கவும்' : 'Select start and end time');
          return;
        }
        if (st >= et) {
          toast.error(isTamil ? 'முடிவு நேரம் தொடக்க நேரத்திற்குப் பிறகு இருக்க வேண்டும்' : 'End time must be after start time');
          return;
        }
        const conflict = existingEntries.some(
          (e) => e.status === 'PARTIALLY_BOOKED' && e.startTime && e.endTime && st < e.endTime && et > e.startTime
        );
        if (conflict) {
          toast.error(isTamil ? 'தேர்ந்தெடுக்கப்பட்ட நேரம் ஏற்கனவே முன்பதிவு செய்யப்பட்டுள்ளது' : 'Selected time conflicts with an existing booking');
          return;
        }
        setCurrentStep(1);
        return;
      }
      if (form.watch('bookingMethod') === 'TOKEN_BOOKING') {
        const tn = form.watch('tokenNumber');
        const tn2 = form.watch('tokenNumber2');
        if (!tn || (!isTokenValid && tokenValidation?.valid === false)) {
          toast.error(isTamil ? 'செல்லுபடியாகும் டோக்கன் எண்ணை உள்ளிடவும் (MK0001-MK6000)' : 'Enter a valid token number (MK0001-MK6000)');
          return;
        }
        if (bookingType === 'TWO_DAY') {
          if (!tn2) {
            toast.error(isTamil ? 'இரண்டாவது டோக்கன் எண்ணை உள்ளிடவும்' : 'Enter the second token number');
            return;
          }
          if (!isToken2Valid) {
            toast.error(isTamil ? 'இரண்டாவது டோக்கன் எண் செல்லாது (MK0001-MK6000)' : 'Invalid second token number (MK0001-MK6000)');
            return;
          }
          if (!areTokensDistinct) {
            toast.error(isTamil ? 'இரண்டு டோக்கன் எண்களும் ஒன்றாக இருக்கக்கூடாது' : 'Both token numbers must be different');
            return;
          }
        }
      }
      setCurrentStep(1);
      return;
    }
    if (currentStep === 1) {
      validateStep1().then(valid => { if (valid) setCurrentStep(2); });
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else navigate(-1);
  };

  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) { toast.error(isTamil ? 'பிழைகளை சரிபார்க்கவும்' : 'Please fix form errors'); return; }
    const vals = form.getValues();
    const dto = {
      customerName: { en: vals.contactName.en, ta: vals.contactName.ta || vals.contactName.en },
      customerPhone: vals.phone,
      customerEmail: vals.email || undefined,
      eventTitle: { en: vals.eventName.en, ta: vals.eventName.ta || vals.eventName.en },
      eventAddress: (vals.doorNo || vals.landmark?.en || vals.landmark?.ta || vals.district) ? (() => {
        const partsEn = [vals.doorNo, vals.landmark?.en].filter(Boolean);
        const partsTa = [vals.doorNo, vals.landmark?.ta].filter(Boolean);
        if (vals.district) {
          const districtTa = DISTRICT_TAMIL[vals.district] || vals.district;
          const districtEn = vals.district.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (vals.taluk && TALUK_TAMIL[vals.taluk]) {
            const talukEn = vals.taluk.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            partsEn.push(`${talukEn}, ${districtEn}`);
            partsTa.push(`${TALUK_TAMIL[vals.taluk]}, ${districtTa}`);
          } else {
            partsEn.push(districtEn);
            partsTa.push(districtTa);
          }
        }
        return { en: partsEn.join(', '), ta: partsTa.join(', ') };
      })() : undefined,
      bookingType: vals.bookingType,
      eventType: vals.eventType,
      bookingMethod: vals.bookingMethod,
      bookingConfig: {
        startDate: vals.selectedDates[0],
        endDate: vals.selectedDates.length > 1 ? vals.selectedDates[vals.selectedDates.length - 1] : undefined,
        startTime: vals.startTime || undefined,
        endTime: vals.endTime || undefined,
        durationHours: durationHours || undefined,
      },
      addonIds: vals.addonIds || undefined,
      addonQuantities: vals.addonQuantities || {},
      addons: (vals.addonIds || []).map((id: string) => ({
        addonId: id,
        amount: (vals.addonAmounts || {})[id] || 0,
        quantity: (vals.addonQuantities || {})[id] || undefined,
        units: (vals.addonUnits || {})[id] || undefined,
      })).filter((a: any) => a.amount > 0),
      advanceAmount: vals.advanceAmount || undefined,
      paymentMethod: vals.paymentMethod || undefined,
      tokenNumber: vals.bookingMethod === 'TOKEN_BOOKING' ? vals.tokenNumber : undefined,
      tokenNumber2: vals.tokenNumber2 || undefined,
    };
    await createBooking.mutateAsync(dto);
    navigate(-1);
  };

  const handleDateChange = (dateVal: string, index: number) => {
    if (index === 0) {
      setDate1(dateVal);
      const dates = [dateVal];
      if (bookingType === 'TWO_DAY' && date2) dates.push(date2);
      setSelectedDates(dates);
      form.setValue('selectedDates', dates);
    } else {
      setDate2(dateVal);
      if (date1) {
        const dates = [date1, dateVal];
        setSelectedDates(dates);
        form.setValue('selectedDates', dates);
      }
    }
  };

  const handleTypeChange = (type: BookingType) => {
    setBookingType(type);
    setDate2('');
    form.setValue('bookingType', type);
    if (type !== 'TWO_DAY' && date1) {
      setSelectedDates([date1]);
      form.setValue('selectedDates', [date1]);
    }
  };

  const bookingTypeOptions = (['HOURLY', 'ONE_DAY', 'TWO_DAY'] as const).map(t => ({
    value: t, label: BOOKING_TYPE_SHORT_LABELS[t],
  }));

  const today = new Date().toISOString().split('T')[0];

  const formData = form.watch();

  return (
    <div className="max-w-4xl mx-auto w-full pt-10 lg:pt-16 pb-8 lg:pb-12 px-2 sm:px-4 min-h-full flex flex-col">
      <form onSubmit={(e: React.FormEvent) => e.preventDefault()} className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
        {currentStep === 0 && (
          <>
            <div className="bg-ivory border border-gold/20 rounded-xl shadow-sm">
              <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft rounded-t-xl flex items-center gap-3">
                <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center">
                  <CalendarDays size={16} />
                </div>
                <h3 className="text-sm font-serif font-bold text-rosewood">
                  {isTamil
                    ? (bookingType === 'HOURLY' ? 'வகை & நேரம்' : 'வகை & முன்பதிவு')
                    : (bookingType === 'HOURLY' ? 'Type & Time' : 'Type & Booking')}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {!isPreselected && (
                  <div className="grid grid-cols-3 gap-3">
                    {bookingTypeOptions.map(opt => {
                      const isActive = bookingType === opt.value;
                      return (
                        <button key={opt.value} type="button" onClick={() => handleTypeChange(opt.value as BookingType)}
                          className={`p-4 rounded-2xl border-2 text-center transition-all ${
                            isActive ? 'bg-rosewood border-rosewood text-white shadow-lg' : 'bg-white border-rosewood/10 text-rosewood hover:border-gold/30'
                          }`}>
                          <p className="font-black text-sm">{isTamil ? opt.label.ta : opt.label.en}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
                {isPreselected && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rosewood/50">{isTamil ? 'வகை' : 'Type'}:</span>
                    <span className="text-sm font-black text-rosewood bg-rosewood/5 px-3 py-1.5 rounded-lg">
                      {BOOKING_TYPE_SHORT_LABELS[bookingType as BookingType]?.[isTamil ? 'ta' : 'en'] || bookingType}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-rosewood/50">{isTamil ? 'தேதி' : 'Date'}</label>
                    <input type="date" value={date1} onChange={e => handleDateChange(e.target.value, 0)} min={today} disabled={!!date1}
                      className="w-full p-3 rounded-xl border border-rosewood/10 bg-white/60 text-rosewood/60 font-bold text-sm cursor-not-allowed" />
                  </div>
                  {bookingType === 'TWO_DAY' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-rosewood/50">{isTamil ? 'இரண்டாம் தேதி' : 'Second Date'}</label>
                      <input type="date" value={date2} onChange={e => handleDateChange(e.target.value, 1)} min={date1 || today} disabled={!!date2}
                        className="w-full p-3 rounded-xl border border-rosewood/10 bg-white/60 text-rosewood/60 font-bold text-sm cursor-not-allowed" />
                    </div>
                  )}
                </div>
                {bookingType === 'HOURLY' && (
                  <div className="border-t border-gold-soft/20 pt-6">
                    <TimeConfigurationSection form={form as any} packageInfo={packageInfo} existingEntries={existingEntries} />
                  </div>
                )}
                {bookingType !== 'HOURLY' && (
                  <div className="border-t border-gold-soft/20 pt-6 space-y-4">
                    <BookingMethodSection form={form as any} />
                    {form.watch('bookingMethod') === 'TOKEN_BOOKING' && (
                      <div className="space-y-3 p-4 bg-ivory/50 rounded-xl border border-gold/10">
                        <p className="text-xs font-bold text-rosewood/50">{isTamil ? 'டோக்கன் எண்' : 'Token Number'}</p>
                        <div className="flex items-center gap-0">
                          <div className="bg-rosewood/10 border border-rosewood/10 border-r-0 rounded-l-xl px-4 py-[11px]">
                            <span className="text-sm font-black text-rosewood">MK</span>
                          </div>
                          <input type="text" inputMode="numeric" maxLength={4}
                            value={form.watch('tokenNumber')?.replace(/^MK/, '') || ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                              form.setValue('tokenNumber', raw ? `MK${raw}` : '', { shouldValidate: true });
                            }}
                            placeholder="0001"
                            className="w-full p-3 rounded-r-xl border border-rosewood/10 bg-white text-rosewood font-black text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none" />
                        </div>
                        {form.watch('tokenNumber') && (
                          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                            isTokenValid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {isTokenValid ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            <span className="text-xs font-bold">
                              {isTokenValid
                                ? (isTamil ? 'செல்லுபடியாகும்' : 'Valid token')
                                : (isTamil ? 'செல்லாது' : 'Invalid (0001-6000)')}
                            </span>
                          </div>
                        )}
                        {bookingType === 'TWO_DAY' && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-rosewood/50">{isTamil ? 'இரண்டாவது டோக்கன் எண்' : 'Second Token Number'}</p>
                            <div className="flex items-center gap-0">
                              <div className="bg-rosewood/10 border border-rosewood/10 border-r-0 rounded-l-xl px-4 py-[11px]">
                                <span className="text-sm font-black text-rosewood">MK</span>
                              </div>
                              <input type="text" inputMode="numeric" maxLength={4}
                                value={form.watch('tokenNumber2')?.replace(/^MK/, '') || ''}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  form.setValue('tokenNumber2', raw ? `MK${raw}` : '', { shouldValidate: true });
                                }}
                                placeholder="0002"
                                className="w-full p-3 rounded-r-xl border border-rosewood/10 bg-white text-rosewood font-black text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none" />
                            </div>
                            {form.watch('tokenNumber2') && (
                              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                                isToken2Valid && areTokensDistinct ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                              }`}>
                                {isToken2Valid && areTokensDistinct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                <span className="text-xs font-bold">
                                  {!areTokensDistinct
                                    ? (isTamil ? 'இரண்டு டோக்கன்களும் ஒன்றாக இருக்கக்கூடாது' : 'Tokens must be different')
                                    : isToken2Valid
                                      ? (isTamil ? 'செல்லுபடியாகும்' : 'Valid token')
                                      : (isTamil ? 'செல்லாது (0001-6000)' : 'Invalid (0001-6000)')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <CustomerEventSection form={form} />
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="bg-ivory border border-gold/20 rounded-3xl shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
                <PackagePlus size={80} />
              </div>
              <div className="bg-ivory/50 px-6 py-4 border-b border-gold-soft flex items-center gap-3 relative z-10">
                <div className="size-8 bg-rosewood-gradient text-white rounded-xl shadow-sm flex items-center justify-center">
                  <PackagePlus size={16} />
                </div>
                <h3 className="text-sm font-serif font-bold text-rosewood">{isTamil ? 'கூடுதல் & கட்டணம்' : 'Addons & Payment'}</h3>
              </div>
              <div className="p-6 space-y-6 relative z-10">
                <AddonSection form={form} addons={addons} />
                <div className="border-t border-gold-soft/20 pt-6">
                  <PaymentSection form={form} bookingMethod={bookingMethod} tokenValidation={tokenValidation} />
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div className="bg-white border border-gold/20 rounded-2xl shadow-sm overflow-hidden">
              <div className="relative bg-linear-to-br from-rosewood via-dark-rosewood to-rosewood px-6 py-5 overflow-hidden">
                <div className="absolute inset-0 bg-kolam-pattern opacity-[0.06]" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="size-10 bg-white/15 text-white rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white">{isTamil ? 'மதிப்பாய்வு' : 'Review'}</h3>
                    <p className="text-[10px] text-white/50 font-bold tracking-wider">{isTamil ? 'அனைத்து விவரங்களையும் சரிபார்க்கவும்' : 'VERIFY ALL DETAILS BEFORE CREATING'}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                      {BOOKING_TYPE_SHORT_LABELS[bookingType as BookingType]?.[isTamil ? 'ta' : 'en'] || bookingType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="relative bg-ivory/50 rounded-4xl border border-gold/10 p-5 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rosewood/[0.02] rounded-bl-[40px] group-hover:scale-110 transition-transform origin-top-right" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-rosewood/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-rosewood/60">person</span>
                        </div>
                        <span className="text-[9px] font-black text-rosewood/40 tracking-[0.15em] uppercase">{isTamil ? 'வாடிக்கையாளர்' : 'Customer'}</span>
                      </div>
                      <p className="text-sm font-black text-rosewood/80">{isTamil ? formData.contactName.ta || formData.contactName.en : formData.contactName.en || formData.contactName.ta}</p>
                      {formData.contactName.en && formData.contactName.ta && (
                        <p className="text-[11px] font-bold text-rosewood/40 italic">{isTamil ? formData.contactName.en : formData.contactName.ta}</p>
                      )}
                      <p className="text-xs font-bold text-rosewood/60 mt-1">{formData.phone}</p>
                      {formData.email && <p className="text-xs text-rosewood/50 mt-0.5">{formData.email}</p>}
                    </div>
                  </div>
                  <div className="relative bg-ivory/50 rounded-4xl border border-gold/10 p-5 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rosewood/[0.02] rounded-bl-[40px] group-hover:scale-110 transition-transform origin-top-right" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-rosewood/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-rosewood/60">celebration</span>
                        </div>
                        <span className="text-[9px] font-black text-rosewood/40 tracking-[0.15em] uppercase">{isTamil ? 'நிகழ்வு' : 'Event'}</span>
                      </div>
                      <p className="text-sm font-black text-rosewood/80">{isTamil ? formData.eventName.ta || formData.eventName.en : formData.eventName.en || formData.eventName.ta}</p>
                      {formData.eventName.en && formData.eventName.ta && (
                        <p className="text-[11px] font-bold text-rosewood/40 italic">{isTamil ? formData.eventName.en : formData.eventName.ta}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative bg-ivory/50 rounded-4xl border border-gold/10 p-5 overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-rosewood/[0.02] rounded-bl-[40px] group-hover:scale-110 transition-transform origin-top-right" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-rosewood/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs text-rosewood/60">calendar_month</span>
                      </div>
                      <span className="text-[9px] font-black text-rosewood/40 tracking-[0.15em] uppercase">{isTamil ? 'தேதி மற்றும் நேரம்' : 'Date & Time'}</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-black text-rosewood">
                        {selectedDates.map(d => new Date(d).toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })).join(' - ')}
                      </p>
                      {bookingType === 'HOURLY' && formData.startTime && (
                        <p className="text-xs font-bold text-rosewood/60">
                          {[formData.startTime, formData.endTime].filter(Boolean).join(' – ')}
                          <span className="ml-2 text-[10px] text-rosewood/40 font-medium">({durationHours.toFixed(2)} {isTamil ? 'மணி' : 'hrs'})</span>
                        </p>
                      )}
                      
                    </div>
                  </div>
                </div>

                {(formData.doorNo || formData.landmark?.en || formData.landmark?.ta || formData.district) && (
                  <div className="relative bg-ivory/50 rounded-4xl border border-gold/10 p-5 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rosewood/[0.02] rounded-bl-[40px] group-hover:scale-110 transition-transform origin-top-right" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-rosewood/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-rosewood/60">location_on</span>
                        </div>
                        <span className="text-[9px] font-black text-rosewood/40 tracking-[0.15em] uppercase">{isTamil ? 'முகவரி' : 'Address'}</span>
                      </div>
                      <p className="text-sm font-black text-rosewood/80">
                        {[formData.doorNo, isTamil ? formData.landmark?.ta || formData.landmark?.en : formData.landmark?.en || formData.landmark?.ta].filter(Boolean).join(', ')}
                      </p>
                      {formData.landmark?.en && formData.landmark?.ta && (
                        <p className="text-[11px] font-bold text-rosewood/40 italic">{isTamil ? formData.landmark.en : formData.landmark.ta}</p>
                      )}
                      {(formData.district || formData.taluk) && (
                        <p className="text-xs font-bold text-rosewood/60 mt-0.5">
                          {[formData.taluk, formData.district].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {formData.bookingMethod === 'TOKEN_BOOKING' && (
                  <div className="relative bg-emerald-50/50 rounded-4xl border border-emerald-200 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:scale-110 transition-transform pointer-events-none">
                      <span className="material-symbols-outlined text-4xl text-emerald-600">confirmation_number</span>
                    </div>
                    <div className="relative z-10 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-emerald-600">confirmation_number</span>
                        </div>
                        <span className="text-[9px] font-black text-emerald-700 tracking-[0.15em] uppercase">{isTamil ? 'டோக்கன் தகவல்' : 'Token Info'}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600/70">{isTamil ? 'டோக்கன் எண்' : 'Token Number'}</span>
                          <span className="text-xs font-black text-emerald-700 font-mono">{formData.tokenNumber}</span>
                        </div>
                        {formData.tokenNumber2 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600/70">{isTamil ? '2வது டோக்கன்' : '2nd Token'}</span>
                            <span className="text-xs font-black text-emerald-700 font-mono">{formData.tokenNumber2}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                          <span className="text-xs font-bold text-emerald-600/70">{isTamil ? 'மூடப்பட்ட தொகுப்பு' : 'Covered Package'}</span>
                          <span className="text-xs font-black text-emerald-700">{isTamil ? packageInfo?.name.ta : packageInfo?.name.en}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative bg-rosewood/5 rounded-4xl border border-rosewood/10 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
                      <span className="material-symbols-outlined text-5xl text-rosewood">receipt_long</span>
                    </div>
                    <div className="relative z-10 p-5">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-6 h-6 rounded-lg bg-rosewood/15 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-rosewood/60">receipt_long</span>
                        </div>
                        <span className="text-[9px] font-black text-rosewood/40 tracking-[0.15em] uppercase">{isTamil ? 'கட்டண விவரங்கள்' : 'Payment Details'}</span>
                      </div>
                      {selectedAddons.length > 0 && (
                        <div className="space-y-2.5 mb-4 pb-4 border-b border-dashed border-rosewood/10">
                          {selectedAddons.map((a: any) => {
                            const addonNameEn = a.translations?.find((t: any) => t.language === 'EN')?.name || '';
                            const addonNameTa = a.translations?.find((t: any) => t.language === 'TA')?.name || '';
                            const price = addonAmounts?.[a.id] ?? 0;
                            const qty = addonQuantities?.[a.id] ?? 1;
                            const units = addonUnits?.[a.id] ?? 1;
                            const total = price * qty * units;
                            const detailParts: string[] = [];
                            if (price) detailParts.push(formatCurrency(price));
                            if (qty > 1) detailParts.push(`×${qty}`);
                            if (units > 1) detailParts.push(`×${units}`);
                            return (
                              <div key={a.id} className="flex items-center justify-between">
                                <span className="text-xs font-bold text-rosewood/60">
                                  {isTamil ? addonNameTa || addonNameEn : addonNameEn || addonNameTa}
                                  {detailParts.length > 0 && <span className="text-[10px] text-rosewood/40 font-normal ml-1">({detailParts.join(' ')})</span>}
                                  {addonNameEn && addonNameTa && <span className="text-[10px] text-rosewood/30 italic ml-1.5">({isTamil ? addonNameEn : addonNameTa})</span>}
                                </span>
                                <span className="text-xs font-black text-rosewood/80">{formatCurrency(total)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {formData.bookingMethod === 'TOKEN_BOOKING' ? (
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-emerald-600/70">{isTamil ? 'டோக்கனால் மூடப்பட்டது' : 'Covered by Token'}</span>
                          <span className="text-xs font-black text-emerald-700">{formatCurrency(packageInfo?.price || 0)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-rosewood/50">{isTamil ? 'தொகுப்பு கட்டணம்' : 'Package Charge'}</span>
                          <span className="text-xs font-black text-rosewood/80">{formatCurrency(packageInfo?.price || 0)}</span>
                        </div>
                      )}
                      {formData.paymentMethod && (
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-dashed border-rosewood/10">
                          <span className="text-xs font-bold text-rosewood/40">{isTamil ? 'கட்டண முறை' : 'Payment Method'}</span>
                          <span className="text-xs font-black text-rosewood/60 capitalize">{formData.paymentMethod?.toLowerCase()}</span>
                        </div>
                      )}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rosewood/50">{isTamil ? 'மொத்த தொகை' : 'Total Amount'}</span>
                          <span className="text-sm font-black text-rosewood">{formatCurrency(totalCharge)}</span>
                        </div>
                        {formData.advanceAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rosewood/50">{isTamil ? 'முன்பணம்' : 'Advance Paid'}</span>
                            <span className="text-xs font-black text-emerald-700">− {formatCurrency(formData.advanceAmount)}</span>
                          </div>
                        )}
                        <div className="border-t-2 border-rosewood/15 pt-2.5" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-rosewood">{isTamil ? 'மீதி தொகை' : 'Balance Due'}</span>
                          <span className={`text-sm font-black ${outstanding <= 0 ? 'text-emerald-700' : 'text-rosewood/70'}`}>
                            {formData.advanceAmount > 0 ? formatCurrency(outstanding) : formatCurrency(totalCharge)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </>
        )}
      </form>

      <div className="mt-auto pt-6 border-t border-gold-soft/10">
        <div className="flex flex-row items-center justify-between gap-3">
          <button onClick={handleBack} disabled={currentStep === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-ivory border border-gold-soft/30 rounded-xl text-xs font-bold text-rosewood/70 hover:text-rosewood hover:border-rosewood/40 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
            <span className="hidden sm:inline">{isTamil ? 'பின்' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-3">
            {currentStep === totalSteps - 1 ? (
              <button onClick={handleSubmit}
                className="flex items-center justify-center gap-1.5 px-6 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-xs hover:bg-rosewood-dark transition-all active:scale-[0.98]">
                {isSubmitting ? <Spinner size="sm" color="white" /> : (
                  <><span className="hidden sm:inline">{isTamil ? 'உருவாக்கு' : 'Create'}</span><span className="material-symbols-outlined text-base">check</span></>
                )}
              </button>
            ) : (
              <button onClick={handleNext}
                className="flex items-center justify-center gap-1.5 px-6 py-3 bg-rosewood text-white font-bold rounded-xl shadow-lg shadow-rosewood/20 text-xs hover:bg-rosewood-dark transition-all active:scale-[0.98]">
                <span className="hidden sm:inline">{isTamil ? 'அடுத்து' : 'Next'}</span>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBooking;
