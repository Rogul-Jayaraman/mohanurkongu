import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BookingFormData, PackageInfo, CalendarEntryInfo } from './bookingFormTypes';
import { useLanguage } from '@/context/LanguageContext';
import { to12, to24, parseTime, fmt12, calcDurationMinutes } from '@/utils/time';

interface TimeConfigurationSectionProps {
  form: UseFormReturn<BookingFormData>;
  packageInfo: PackageInfo | null;
  existingEntries: CalendarEntryInfo[];
  selectedDate?: string;
  onConflictChange?: (hasConflict: boolean) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const ALL_MINUTES = ['00', '15', '30', '45'];

interface TimeSegmentProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
  disabled?: boolean;
}

function TimeSegment({ value, options, onChange, label, disabled }: TimeSegmentProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.indexOf(value);
  const ITEM_HEIGHT = 36;
  const VISIBLE_ITEMS = 7;

  useEffect(() => {
    if (!open || !listRef.current || selectedIndex < 0) return;
    const top = selectedIndex * ITEM_HEIGHT;
    listRef.current.scrollTop = Math.max(0, top - ITEM_HEIGHT * 3);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (open) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const itemTop = activeIndex * ITEM_HEIGHT;
    if (itemTop < container.scrollTop || itemTop + ITEM_HEIGHT > container.scrollTop + container.clientHeight) {
      container.scrollTop = Math.max(0, itemTop - ITEM_HEIGHT * 2);
    }
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = Math.min(options.length, VISIBLE_ITEMS) * ITEM_HEIGHT + 24;
    setPosition(spaceAbove >= dropdownHeight ? 'top' : 'bottom');
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const commit = useCallback((idx: number) => {
    if (idx >= 0 && idx < options.length) {
      onChange(options[idx]);
      setOpen(false);
    }
  }, [options, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) { commit(activeIndex); return; }
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(prev => Math.max(0, Math.min(options.length - 1, prev + dir)));
    }
  }, [open, activeIndex, options, commit]);

  return (
    <div ref={containerRef} className="relative flex-1 h-full flex items-stretch">
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(p => !p); }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className="w-full h-full min-w-0 px-2 bg-transparent text-sm font-bold text-rosewood outline-none cursor-pointer flex items-center justify-center gap-1 transition-colors hover:text-rosewood/80 disabled:opacity-50"
      >
        <span className="tabular-nums tracking-tight leading-none">{value}</span>
        <svg className={`w-3 h-3 shrink-0 text-rosewood/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)} />
          <div
            ref={listRef}
            role="listbox"
            aria-label={label}
            className={`z-50 absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 bg-white border border-rosewood/10 rounded-xl shadow-xl overflow-y-auto min-w-[80px] p-1.5 animate-in fade-in duration-200 ${
              position === 'bottom' ? 'top-full mt-1 slide-in-from-top-2' : 'bottom-full mb-1 slide-in-from-bottom-2'
            }`}
            style={{ maxHeight: `${ITEM_HEIGHT * VISIBLE_ITEMS}px` }}
          >
            {options.map((opt, idx) => {
              const isSelected = opt === value;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={opt}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => commit(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full text-left px-3 rounded-lg text-sm cursor-pointer transition-all ${
                    isActive
                      ? 'bg-rosewood/10 text-rosewood font-bold'
                      : isSelected
                      ? 'bg-rosewood/8 text-rosewood font-bold'
                      : 'text-rosewood/60 hover:bg-rosewood/5 font-medium'
                  }`}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export const TimeConfigurationSection: React.FC<TimeConfigurationSectionProps> = ({ form, packageInfo, existingEntries, selectedDate, onConflictChange }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  const errors = form.formState.errors;

  const isFullyBooked = useMemo(() => existingEntries.some((e) => e.status === 'FULLY_BOOKED'), [existingEntries]);
  const isBlocked = useMemo(() => existingEntries.some((e) => e.status === 'BLOCKED'), [existingEntries]);

  const bookedSlots = useMemo(
    () =>
      existingEntries
        .filter((e) => e.status === 'PARTIALLY_BOOKED' && e.startTime && e.endTime)
        .map((e) => ({ startTime: e.startTime!, endTime: e.endTime! })),
    [existingEntries]
  );

  const hasConflict = useMemo(() => {
    if (!startTime || !endTime || bookedSlots.length === 0) return false;
    return bookedSlots.some((slot) => startTime < slot.endTime && endTime > slot.startTime);
  }, [startTime, endTime, bookedSlots]);

  const isPastTime = useMemo(() => {
    if (!startTime || !selectedDate) return false;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (selectedDate !== today) return false;
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return startTime <= currentHHMM;
  }, [startTime, selectedDate]);

  const isTimeInvalid = hasConflict || isPastTime;

  useEffect(() => {
    onConflictChange?.(isTimeInvalid);
  }, [isTimeInvalid, onConflictChange]);

  const parsedStart = useMemo(() => (startTime ? parseTime(startTime) : null), [startTime]);
  const parsedEnd = useMemo(() => (endTime ? parseTime(endTime) : null), [endTime]);

  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime) return 0;
    return calcDurationMinutes(startTime, endTime);
  }, [startTime, endTime]);

  const startParsed = startTime ? to12(parseInt(startTime.split(':')[0], 10)) : { h12: 12, mer: 'AM' as const };
  const startMin = startTime ? startTime.split(':')[1] : '00';
  const endParsed = endTime ? to12(parseInt(endTime.split(':')[0], 10)) : { h12: 12, mer: 'AM' as const };
  const endMin = endTime ? endTime.split(':')[1] : '00';

  const [startHour, setStartHour] = useState(String(startParsed.h12).padStart(2, '0'));
  const [startMinute, setStartMinute] = useState(ALL_MINUTES.includes(startMin) ? startMin : '00');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>(startParsed.mer);

  const [endHour, setEndHour] = useState(String(endParsed.h12).padStart(2, '0'));
  const [endMinute, setEndMinute] = useState(ALL_MINUTES.includes(endMin) ? endMin : '00');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>(endParsed.mer);

  useEffect(() => {
    const h = to24(parseInt(startHour, 10), startPeriod);
    form.setValue('startTime', `${String(h).padStart(2, '0')}:${startMinute}`, { shouldValidate: false });
  }, [startHour, startMinute, startPeriod]);

  useEffect(() => {
    const h = to24(parseInt(endHour, 10), endPeriod);
    form.setValue('endTime', `${String(h).padStart(2, '0')}:${endMinute}`, { shouldValidate: false });
  }, [endHour, endMinute, endPeriod]);

  if (isBlocked) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-500 shrink-0" />
        <p className="text-xs font-bold text-red-700">
          {isTamil ? 'இந்த தேதி தடுக்கப்பட்டுள்ளது' : 'This date is blocked'}
        </p>
      </div>
    );
  }

  if (isFullyBooked) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
        <p className="text-xs font-bold text-amber-700">
          {isTamil ? 'இந்த தேதி முழுமையாக முன்பதிவு செய்யப்பட்டுள்ளது' : 'This date is fully booked'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-rosewood/[0.02] border border-rosewood/10 rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-rosewood/40" />
        <p className="text-xs font-bold text-rosewood/30">{isTamil ? 'நேரம்' : 'Time'}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Start Time */}
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-rosewood/50 mb-1.5 block">
            {isTamil ? 'தொடக்க நேரம்' : 'Start Time'}
          </label>
          <div className={`flex items-stretch border-2 rounded-xl bg-white transition-all ${
            isTimeInvalid ? 'border-red-400 bg-red-50' : errors.startTime ? 'border-red-400' : 'border-rosewood/10 hover:border-rosewood/30 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold'
          }`}>
            <div className="flex-1 flex items-stretch min-w-0 h-[48px]">
              <div className="flex-1 min-w-[60px] max-w-[80px] sm:max-w-[100px]">
                <TimeSegment value={startHour} options={HOURS} onChange={setStartHour} label="Hour" />
              </div>
              <div className="flex items-center justify-center shrink-0 w-4">
                <span className="text-rosewood/20 font-bold text-sm leading-none select-none">:</span>
              </div>
              <div className="flex-1 min-w-[60px] max-w-[80px] sm:max-w-[100px]">
                <TimeSegment value={startMinute} options={ALL_MINUTES} onChange={setStartMinute} label="Minute" />
              </div>
              <div className="w-px self-stretch my-2 bg-rosewood/10 shrink-0" />
              <div className="flex-1 min-w-[50px] max-w-[70px] sm:max-w-[90px]">
                <TimeSegment value={startPeriod} options={['AM', 'PM']} onChange={(v) => setStartPeriod(v as 'AM' | 'PM')} label="AM/PM" />
              </div>
            </div>
          </div>
          {errors.startTime && (
            <p className="text-[10px] text-red-500 mt-1">{errors.startTime.message as string}</p>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 self-center sm:pt-6">
          <div className="h-px w-4 bg-rosewood/20 hidden sm:block" />
          <span className="text-xs font-bold text-rosewood/40 tabular-nums whitespace-nowrap flex items-center gap-1">
            <ArrowRight size={14} className="text-rosewood/30" />
            {durationMinutes > 0
              ? `${durationMinutes >= 60
                  ? (durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)
                  : durationMinutes}${durationMinutes >= 60 ? (isTamil ? 'ம' : 'h') : (isTamil ? 'நி' : 'm')}`
              : ''}
          </span>
          <div className="h-px w-4 bg-rosewood/20 hidden sm:block" />
        </div>

        {/* End Time */}
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-rosewood/50 mb-1.5 block">
            {isTamil ? 'முடிவு நேரம்' : 'End Time'}
          </label>
          <div className={`flex items-stretch border-2 rounded-xl bg-white transition-all ${
            isTimeInvalid ? 'border-red-400 bg-red-50' : errors.endTime ? 'border-red-400' : 'border-rosewood/10 hover:border-rosewood/30 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold'
          }`}>
            <div className="flex-1 flex items-stretch min-w-0 h-[48px]">
              <div className="flex-1 min-w-[60px] max-w-[80px] sm:max-w-[100px]">
                <TimeSegment value={endHour} options={HOURS} onChange={setEndHour} label="Hour" />
              </div>
              <div className="flex items-center justify-center shrink-0 w-4">
                <span className="text-rosewood/20 font-bold text-sm leading-none select-none">:</span>
              </div>
              <div className="flex-1 min-w-[60px] max-w-[80px] sm:max-w-[100px]">
                <TimeSegment value={endMinute} options={ALL_MINUTES} onChange={setEndMinute} label="Minute" />
              </div>
              <div className="w-px self-stretch my-2 bg-rosewood/10 shrink-0" />
              <div className="flex-1 min-w-[50px] max-w-[70px] sm:max-w-[90px]">
                <TimeSegment value={endPeriod} options={['AM', 'PM']} onChange={(v) => setEndPeriod(v as 'AM' | 'PM')} label="AM/PM" />
              </div>
            </div>
          </div>
          {errors.endTime && (
            <p className="text-[10px] text-red-500 mt-1">{errors.endTime.message as string}</p>
          )}
        </div>
      </div>

      {/* Conflict / past-time warning — always visible when invalid */}
      {isTimeInvalid && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-red-700">
              {isPastTime
                ? (isTamil ? 'தொடக்க நேரம் ஏற்கனவே கடந்துவிட்டது — எதிர்கால நேரத்தைத் தேர்ந்தெடுக்கவும்' : 'Start time has already passed — select a future time')
                : (isTamil ? 'தேர்ந்தெடுக்கப்பட்ட நேரம் ஏற்கனவே முன்பதிவு செய்யப்பட்ட நேரத்துடன் முரண்படுகிறது' : 'Selected time conflicts with an existing booking')}
            </p>
            {isPastTime && (
              <p className="text-[10px] text-red-500/70 mt-1 font-medium">
                {isTamil ? 'தயவுசெய்து வேறு நேரத்தைத் தேர்ந்தெடுக்கவும்' : 'Please choose a different time'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Booked slots */}
      {bookedSlots.length > 0 && (
        <div className="pt-3 border-t border-rosewood/5">
          <p className="text-[10px] font-bold text-rosewood/40 mb-2">
            {isTamil ? 'முன்பதிவு செய்யப்பட்ட நேரங்கள்' : 'Booked Slots'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {bookedSlots.map((slot, i) => {
              const sP = parseTime(slot.startTime);
              const eP = parseTime(slot.endTime);
              const label = sP && eP ? `${fmt12(slot.startTime)} → ${fmt12(slot.endTime)}` : `${slot.startTime} → ${slot.endTime}`;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rosewood/5 rounded-lg text-[10px] font-bold text-rosewood/50 border border-rosewood/10"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rosewood/20 shrink-0" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
