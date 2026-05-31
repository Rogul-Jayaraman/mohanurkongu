import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { FormProvider } from 'react-hook-form';
import { useLanguage } from '@/context/LanguageContext';
import { adminCreateBooking } from '@/api/mandapam.api';
import { formatCurrency } from '@/utils/format';
import type { BookingType } from '@/types/mandapam';
import type { CalendarEntryInfo } from './bookingFormTypes';

import { useBookingForm } from './useBookingForm';
import { BookingHeader } from './BookingHeader';
import { BookingMethodSection } from './BookingMethodSection';
import { TimeConfigurationSection } from './TimeConfigurationSection';
import { CustomerSection } from './CustomerSection';
import { EventSection } from './EventSection';
import { AddonSection } from './AddonSection';
import { PaymentSection } from './PaymentSection';
import { BookingSummaryPanel } from './BookingSummaryPanel';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  bookingType?: BookingType;
  selectedDates?: string[];
  existingEntries?: CalendarEntryInfo[];
}

interface StepConfig {
  label: { en: string; ta: string };
  sections: string[];
  fields: string[][];
}

const HOURLY_STEPS: StepConfig[] = [
  {
    label: { en: 'Type & Time', ta: 'வகை மற்றும் நேரம்' },
    sections: ['type', 'time'],
    fields: [['bookingType'], ['startTime', 'endTime']],
  },
  {
    label: { en: 'Details & Addons', ta: 'விவரங்கள் மற்றும் கூடுதல்' },
    sections: ['customer', 'event', 'addons'],
    fields: [['contactName.en', 'phone'], ['eventName.en', 'eventType'], []],
  },
  {
    label: { en: 'Payment & Confirm', ta: 'கட்டணம் மற்றும் உறுதிப்படுத்தல்' },
    sections: ['payment', 'review'],
    fields: [['advanceAmount', 'paymentMethod']],
  },
];

const STANDARD_STEPS: StepConfig[] = [
  {
    label: { en: 'Type & Booking', ta: 'வகை மற்றும் முன்பதிவு' },
    sections: ['type', 'packageToken'],
    fields: [['bookingType'], ['bookingMethod', 'tokenNumber', 'tokenNumber2']],
  },
  {
    label: { en: 'Customer & Event', ta: 'வாடிக்கையாளர் மற்றும் நிகழ்வு' },
    sections: ['customer', 'event'],
    fields: [['contactName.en', 'phone'], ['eventName.en', 'eventType']],
  },
  {
    label: { en: 'Addons', ta: 'கூடுதல்' },
    sections: ['addons'],
    fields: [[]],
  },
  {
    label: { en: 'Payment & Confirm', ta: 'கட்டணம் மற்றும் உறுதிப்படுத்தல்' },
    sections: ['payment', 'review'],
    fields: [['advanceAmount', 'paymentMethod']],
  },
];

const EVENT_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  MARRIAGE: { en: 'Marriage', ta: 'திருமணம்' },
  RECEPTION: { en: 'Reception', ta: 'வரவேற்பு' },
  ENGAGEMENT: { en: 'Engagement', ta: 'நிச்சயதார்த்தம்' },
  BIRTHDAY: { en: 'Birthday', ta: 'பிறந்தநாள்' },
  BABY_SHOWER: { en: 'Baby Shower', ta: 'குழந்தை வளைகாப்பு' },
  EAR_PIERCING: { en: 'Ear Piercing', ta: 'காது குத்தல்' },
  PUBERTY_FUNCTION: { en: 'Puberty Function', ta: 'பருவமடைதல் விழா' },
  OTHER: { en: 'Other', ta: 'மற்றவை' },
};

const BOOKING_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  HOURLY: { en: 'Hourly', ta: 'மணிநேரம்' },
  ONE_DAY: { en: '1 Day', ta: '1 நாள்' },
  TWO_DAY: { en: '2 Day', ta: '2 நாள்' },
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen, onClose, onSuccess,
  bookingType = 'ONE_DAY', selectedDates = [], existingEntries = [],
}) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const prevBookingType = useRef(bookingType);
  const prevSelectedDates = useRef(selectedDates);

  const {
    form, packageInfo, addons, durationHours,
    addonCharge, totalCharge, outstanding,
    tokenValidation, canShowBookingMethod,
    bookingMethod, startTime, endTime, addonIds, advanceAmount,
    tokenNumber, tokenNumber2,
  } = useBookingForm(bookingType, selectedDates);

  const formData = form.watch();
  const currentBookingType = formData?.bookingType || bookingType;
  const steps = currentBookingType === 'HOURLY' ? HOURLY_STEPS : STANDARD_STEPS;

  const dateEntries = useMemo(() => {
    const targetDate = selectedDates[0];
    if (!targetDate || !existingEntries.length) return [];
    return existingEntries.filter(e => e.date.split('T')[0] === targetDate);
  }, [selectedDates, existingEntries]);
  const totalSteps = steps.length;
  const displayStart = useMemo(() => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    if (isNaN(h)) return startTime;
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }, [startTime]);
  const displayEnd = useMemo(() => {
    if (!endTime) return '';
    const [h, m] = endTime.split(':').map(Number);
    if (isNaN(h)) return endTime;
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }, [endTime]);

  useEffect(() => {
    const typeChanged = prevBookingType.current !== bookingType;
    const datesChanged = prevSelectedDates.current.join(',') !== selectedDates.join(',');
    if (typeChanged || datesChanged) {
      if (typeChanged) prevBookingType.current = bookingType;
      if (datesChanged) prevSelectedDates.current = selectedDates;
      setCurrentStep(0);
      form.reset({
        bookingType,
        bookingMethod: 'NORMAL_BOOKING',
        selectedDates,
        startTime: '',
        endTime: '',
        durationHours: 0,
        contactName: { en: '', ta: '' },
        phone: '',
        email: '',
        address: { en: '', ta: '' },
        eventName: { en: '', ta: '' },
        eventType: 'OTHER',
        addonIds: [],
        advanceAmount: 0,
        paymentMethod: 'CASH',
        tokenNumber: '',
        tokenNumber2: '',
      });
    }
  }, [bookingType, selectedDates]);

  const handleTypeChange = (newType: BookingType) => {
    form.setValue('bookingType', newType);
    form.setValue('bookingMethod', 'NORMAL_BOOKING');
    if (newType !== 'HOURLY') {
      form.setValue('startTime', '');
      form.setValue('endTime', '');
      form.setValue('durationHours', 0);
    }
    setCurrentStep(0);
  };

  const validateStep = useCallback(async (step: number): Promise<boolean> => {
    const stepFields = steps[step].fields.flat().filter(Boolean);
    if (stepFields.length === 0) return true;

    const valid = await form.trigger(stepFields as any);
    if (!valid) return false;

    if (steps[step].sections.includes('time')) {
      return form.trigger(['startTime', 'endTime'] as any);
    }
    if (steps[step].sections.includes('packageToken')) {
      const method = form.getValues('bookingMethod');
      if (method === 'TOKEN_BOOKING') {
        const fields: string[] = ['tokenNumber'];
        if (currentBookingType === 'TWO_DAY') fields.push('tokenNumber2');
        return form.trigger(fields as any);
      }
    }
    return true;
  }, [steps, form, currentBookingType]);

  const handleNext = async () => {
    const valid = await validateStep(currentStep);
    if (!valid) {
      toast.error(isTamil ? 'பிழைகளை சரிபார்க்கவும்' : 'Please fix form errors');
      return;
    }
    setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
  };

  const handleConfirmCreate = async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error(isTamil ? 'பிழைகளை சரிபார்க்கவும்' : 'Please fix form errors');
      return;
    }
    setIsCreating(true);
    const vals = form.getValues();
    try {
      const dto = {
        customerName: { en: vals.contactName.en, ta: vals.contactName.ta || vals.contactName.en },
        customerPhone: vals.phone,
        customerEmail: vals.email || undefined,
        eventTitle: { en: vals.eventName.en, ta: vals.eventName.ta || vals.eventName.en },
        eventAddress: (vals.address?.en || vals.address?.ta) ? { en: vals.address?.en || vals.address?.ta, ta: vals.address?.ta || vals.address?.en || '' } : undefined,
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
        addonIds: vals.addonIds || [],
        tokenNumber: vals.bookingMethod === 'TOKEN_BOOKING' ? vals.tokenNumber : undefined,
        tokenNumber2: vals.bookingMethod === 'TOKEN_BOOKING' && vals.bookingType === 'TWO_DAY' ? vals.tokenNumber2 : undefined,
        advanceAmount: vals.bookingMethod === 'NORMAL_BOOKING' ? vals.advanceAmount : undefined,
        paymentMethod: vals.bookingMethod === 'NORMAL_BOOKING' ? vals.paymentMethod : undefined,
      };

      await adminCreateBooking(dto as any);
      toast.success(isTamil ? 'முன்பதிவு வெற்றிகரமாக உருவாக்கப்பட்டது' : 'Booking created successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || (isTamil ? 'முன்பதிவு தோல்வி' : 'Failed to create booking'));
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const selectedAddons = addons.filter((a: any) => formData.addonIds?.includes(a.id));

  const renderSection = (section: string) => {
    const errors = form.formState.errors;

    switch (section) {
      case 'type':
        return (
          <BookingHeader
            bookingType={currentBookingType}
            packageInfo={packageInfo}
            selectedDates={selectedDates}
            onBookingTypeChange={handleTypeChange}
          />
        );
      case 'time':
        return currentBookingType === 'HOURLY' ? (
          <TimeConfigurationSection form={form as any} packageInfo={packageInfo} existingEntries={dateEntries} />
        ) : null;
      case 'packageToken':
        return currentBookingType !== 'HOURLY' ? (
          <div className="space-y-4">
            <BookingMethodSection form={form as any} />
            {formData.bookingMethod === 'TOKEN_BOOKING' && (
              <div className="space-y-3 p-4 bg-ivory/50 rounded-xl border border-gold/10">
                <p className="text-xs font-bold text-rosewood/50">
                  {isTamil ? 'டோக்கன் எண்' : 'Token Number'}
                </p>
                <input
                  value={formData.tokenNumber || ''}
                  onChange={e => form.setValue('tokenNumber', e.target.value, { shouldValidate: true })}
                  placeholder={isTamil ? 'டோக்கன் எண்ணை உள்ளிடவும்' : 'Enter token number'}
                  className="w-full p-3 rounded-xl border border-rosewood/10 bg-white text-rosewood font-bold text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                />
                {errors.tokenNumber && (
                  <p className="text-[10px] text-red-500">{errors.tokenNumber.message}</p>
                )}
                {currentBookingType === 'TWO_DAY' && (
                  <>
                    <p className="text-xs font-bold text-rosewood/50">
                      {isTamil ? 'இரண்டாவது டோக்கன் எண்' : 'Second Token Number'}
                    </p>
                    <input
                      value={formData.tokenNumber2 || ''}
                      onChange={e => form.setValue('tokenNumber2', e.target.value, { shouldValidate: true })}
                      placeholder={isTamil ? 'இரண்டாவது டோக்கன் எண்ணை உள்ளிடவும்' : 'Enter second token number'}
                      className="w-full p-3 rounded-xl border border-rosewood/10 bg-white text-rosewood font-bold text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                    />
                    {errors.tokenNumber2 && (
                      <p className="text-[10px] text-red-500">{errors.tokenNumber2.message}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : null;
      case 'customer':
        return <CustomerSection form={form as any} />;
      case 'event':
        return <EventSection form={form as any} />;
      case 'addons':
        return <AddonSection form={form as any} addons={addons} />;
      case 'payment':
        return (
          <PaymentSection
            form={form as any}
            bookingMethod={bookingMethod}
            tokenValidation={tokenValidation}
          />
        );
      case 'review':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-rosewood/40" />
                <p className="text-xs font-bold text-rosewood/30">
                  {isTamil ? 'மதிப்பாய்வு' : 'Review'}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-ivory/50 border border-gold/10">
                <p className="text-xs font-bold text-rosewood/40 mb-2">{isTamil ? 'முன்பதிவு' : 'Booking'}</p>
                <p className="text-sm font-black text-rosewood">{isTamil ? BOOKING_TYPE_LABELS[formData.bookingType]?.ta : BOOKING_TYPE_LABELS[formData.bookingType]?.en}</p>
                <p className="text-xs text-rosewood/60 font-bold">{packageInfo?.code}</p>
                <p className="text-xs text-rosewood/40 font-mono mt-1">
                  {(formData.selectedDates?.[0] || '—')}{formData.selectedDates?.length > 1 ? ` → ${formData.selectedDates[formData.selectedDates.length - 1]}` : ''}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-ivory/50 border border-gold/10">
                <p className="text-xs font-bold text-rosewood/40 mb-2">{isTamil ? 'வாடிக்கையாளர்' : 'Customer'}</p>
                <p className="text-sm font-black text-rosewood">{isTamil && formData.contactName.ta ? formData.contactName.ta : formData.contactName.en}</p>
                <p className="text-xs text-rosewood/60 font-bold">{formData.phone}</p>
                {formData.email && <p className="text-xs text-rosewood/40">{formData.email}</p>}
              </div>
            </div>

            {currentBookingType === 'HOURLY' && startTime && endTime && (
              <div className="p-4 rounded-xl bg-ivory/50 border border-gold/10 flex items-center gap-3">
                <Clock size={16} className="text-rosewood/40" />
                <div>
                  <p className="text-xs font-bold text-rosewood/40">{isTamil ? 'நேரம்' : 'Time'}</p>
                  <p className="text-sm font-black text-rosewood">{displayStart} → {displayEnd} ({durationHours} {isTamil ? 'மணி' : 'hrs'})</p>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-ivory/50 border border-gold/10">
              <p className="text-xs font-bold text-rosewood/40 mb-2">{isTamil ? 'நிகழ்வு' : 'Event'}</p>
              <p className="text-sm font-black text-rosewood">{isTamil && formData.eventName.ta ? formData.eventName.ta : formData.eventName.en}</p>
              <p className="text-xs text-rosewood/60 font-bold">{isTamil ? EVENT_TYPE_LABELS[formData.eventType]?.ta : EVENT_TYPE_LABELS[formData.eventType]?.en}</p>
            </div>

            {selectedAddons.length > 0 && (
              <div className="p-4 rounded-xl bg-ivory/50 border border-gold/10">
                <p className="text-xs font-bold text-rosewood/40 mb-2">{isTamil ? 'கூடுதல் சேவைகள்' : 'Addons'}</p>
                <div className="space-y-1">
                  {selectedAddons.map((a: any) => {
                    const name = a.translations?.find((t: any) => t.language === (isTamil ? 'TA' : 'EN'))?.name || '';
                    return (
                      <div key={a.id} className="flex justify-between text-xs">
                        <span className="text-rosewood/70 font-bold">{name}</span>
                        <span className="text-rosewood font-black">{formatCurrency(Number(a.amount))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentBookingType !== 'HOURLY' && formData.bookingMethod === 'TOKEN_BOOKING' && formData.tokenNumber && (
              <div className="p-4 rounded-xl bg-ivory/50 border border-gold/10">
                <p className="text-xs font-bold text-rosewood/40 mb-2">{isTamil ? 'டோக்கன்' : 'Token'}</p>
                <p className="text-sm font-black text-rosewood font-mono">{formData.tokenNumber}</p>
                {formData.tokenNumber2 && (
                  <p className="text-sm font-black text-rosewood font-mono mt-1">{formData.tokenNumber2}</p>
                )}
              </div>
            )}

              <div className="p-4 rounded-xl bg-rosewood/5 border border-rosewood/10">
                <p className="text-xs font-bold text-rosewood/40 mb-3">{isTamil ? 'நிதி சுருக்கம்' : 'Financial Summary'}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-rosewood/50 font-bold">
                      {currentBookingType === 'HOURLY'
                        ? (isTamil ? 'தொகுப்பு விலை/மணி' : 'Package Rate/hr')
                        : (isTamil ? 'தொகுப்பு கட்டணம்' : 'Package Charge')}
                    </span>
                    <span className="text-rosewood font-black">{formatCurrency(packageInfo?.price || 0)}</span>
                  </div>
                  {currentBookingType === 'HOURLY' && durationHours > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-rosewood/40 font-bold">{isTamil ? 'கால அளவு' : 'Duration'}</span>
                      <span className="text-rosewood/70 font-bold">{durationHours} {isTamil ? 'மணி' : 'hrs'}</span>
                    </div>
                  )}
                  {currentBookingType === 'HOURLY' && durationHours > 0 && (
                    <div className="flex justify-between text-xs border-t border-rosewood/10 pt-1.5 mt-1">
                      <span className="text-rosewood/70 font-bold">
                        {formatCurrency(packageInfo?.price || 0)} × {durationHours}
                      </span>
                      <span className="text-rosewood font-black">{formatCurrency((packageInfo?.price || 0) * durationHours)}</span>
                    </div>
                  )}
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-rosewood/50 font-bold">{isTamil ? 'கூடுதல் கட்டணம்' : 'Addon Charge'}</span>
                    <span className="text-rosewood font-black">{formatCurrency(addonCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-rosewood/20">
                  <span className="text-rosewood font-black">{isTamil ? 'மொத்தம்' : 'Total'}</span>
                  <span className="text-rosewood font-black">{formatCurrency(totalCharge)}</span>
                </div>
                {(currentBookingType === 'HOURLY' || formData.bookingMethod === 'NORMAL_BOOKING') && formData.advanceAmount > 0 && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-rosewood/50 font-bold">{isTamil ? 'முன்பணம்' : 'Advance'}</span>
                      <span className="text-emerald-700 font-black">- {formatCurrency(formData.advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-rosewood font-black">{isTamil ? 'மீதி' : 'Outstanding'}</span>
                      <span className={`font-black ${outstanding <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(outstanding)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;
    return (
      <div className="space-y-8">
        {step.sections.map(section => (
          <div key={section}>
            {renderSection(section)}
          </div>
        ))}
      </div>
    );
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gold-soft/10 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl bg-gold-soft/5 backdrop-blur-3xl border-2 border-gold/30 rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
          >
            <div className="px-6 py-5 bg-gold-soft/5 backdrop-blur-xl border-b border-gold/10 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black text-rosewood tracking-tight">
                {isTamil ? 'புதிய முன்பதிவு' : 'New Booking'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 bg-rosewood text-white rounded-full transition-all hover:bg-rosewood/80 hover:rotate-90 duration-300"
              >
                <X size={20} />
              </button>
            </div>

            {steps.length > 1 && (
              <div className="px-6 py-4 border-b border-gold/10 bg-gold-soft/5 shrink-0">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  {steps.map((step, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                          i === currentStep
                            ? 'bg-rosewood text-white shadow-lg shadow-rosewood/20'
                            : i < currentStep
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rosewood/10 text-rosewood/40'
                        }`}>
                          {i < currentStep ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : i + 1}
                        </div>
                        <span className={`text-xs font-bold hidden sm:block ${
                          i === currentStep ? 'text-rosewood' : i < currentStep ? 'text-emerald-600' : 'text-rosewood/30'
                        }`}>
                          {isTamil ? step.label.ta : step.label.en}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-px mx-3 transition-all ${
                          i < currentStep ? 'bg-emerald-300' : 'bg-rosewood/10'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <FormProvider {...form}>
              {renderStepContent()}
            </FormProvider>

            <div className="flex items-center justify-between pt-6 border-t border-gold/10 mt-8">
              <button
                type="button"
                onClick={currentStep === 0 ? onClose : handleBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-rosewood/10 text-rosewood font-bold text-xs hover:bg-rosewood/5 transition-all"
              >
                <ChevronLeft size={16} />
                {currentStep === 0
                  ? (isTamil ? 'ரத்துசெய்' : 'Cancel')
                  : (isTamil ? 'பின்' : 'Back')}
              </button>

              {currentStep < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                    className="flex items-center gap-2 px-10 py-3 rounded-xl bg-rosewood text-ivory font-bold text-xs shadow-lg shadow-rosewood/20 hover:shadow-xl hover:shadow-rosewood/30 transition-all active:scale-95"
                >
                  {isTamil ? 'அடுத்து' : 'Next'}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={isCreating}
                    className="flex items-center gap-2 px-10 py-3 rounded-xl bg-rosewood text-ivory font-bold text-xs shadow-lg shadow-rosewood/20 hover:shadow-xl hover:shadow-rosewood/30 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isCreating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    isTamil ? 'முன்பதிவு செய்' : 'Create Booking'
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-[320px] shrink-0 p-6 bg-gold-soft/5 border-l border-gold/10 overflow-y-auto custom-scrollbar">
            <BookingSummaryPanel
              bookingType={currentBookingType}
              packageInfo={packageInfo}
              durationHours={durationHours}
              addonIds={addonIds}
              addons={addons}
              addonCharge={addonCharge}
              totalCharge={totalCharge}
              advanceAmount={advanceAmount}
              outstanding={outstanding}
              bookingMethod={bookingMethod}
              tokenNumber={tokenNumber}
            />
          </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
