import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, AlertTriangle, Sun, Moon, ChevronDown, Check, ArrowRight } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BookingFormData, PackageInfo, CalendarEntryInfo } from './bookingFormTypes';
import { useLanguage } from '@/context/LanguageContext';

interface TimeConfigurationSectionProps {
  form: UseFormReturn<BookingFormData>;
  packageInfo: PackageInfo | null;
  existingEntries: CalendarEntryInfo[];
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS = ['AM', 'PM'];

function to12(h: number) {
  if (h === 0) return { h12: 12, mer: 'AM' as const };
  if (h < 12) return { h12: h, mer: 'AM' as const };
  if (h === 12) return { h12: 12, mer: 'PM' as const };
  return { h12: h - 12, mer: 'PM' as const };
}

function to24(h12: number, mer: 'AM' | 'PM') {
  if (mer === 'AM') return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function parseTime(t: string) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { h24: h, m };
}

function fmt12(t: string) {
  const p = parseTime(t);
  if (!p) return '';
  const { h12, mer } = to12(p.h24);
  return `${h12}:${String(p.m).padStart(2, '0')} ${mer}`;
}

export const TimeConfigurationSection: React.FC<TimeConfigurationSectionProps> = ({ form, packageInfo, existingEntries }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  const errors = form.formState.errors;

  const [editing, setEditing] = useState<'start' | 'end' | null>(null);
  const [hVal, setHVal] = useState('09');
  const [mVal, setMVal] = useState('00');
  const [pVal, setPVal] = useState<'AM' | 'PM'>('AM');
  const inputRef = useRef<HTMLDivElement>(null);

  const parsedStart = useMemo(() => startTime ? parseTime(startTime) : null, [startTime]);
  const parsedEnd = useMemo(() => endTime ? parseTime(endTime) : null, [endTime]);

  const isFullyBooked = useMemo(() =>
    existingEntries.some(e => e.status === 'FULLY_BOOKED'),
  [existingEntries]);

  const isBlocked = useMemo(() =>
    existingEntries.some(e => e.status === 'BLOCKED'),
  [existingEntries]);

  const bookedSlots = useMemo(() =>
    existingEntries
      .filter(e => e.status === 'PARTIALLY_BOOKED' && e.startTime && e.endTime)
      .map(e => ({ startTime: e.startTime!, endTime: e.endTime! })),
  [existingEntries]);

  const durationMinutes = useMemo(() => {
    if (!parsedStart || !parsedEnd) return 0;
    const diff = (parsedEnd.h24 * 60 + parsedEnd.m) - (parsedStart.h24 * 60 + parsedStart.m);
    return diff > 0 ? diff : 0;
  }, [parsedStart, parsedEnd]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) setEditing(null);
    };
    if (editing) { document.addEventListener('mousedown', handler); }
    return () => document.removeEventListener('mousedown', handler);
  }, [editing]);

  const applyTime = (field: 'startTime' | 'endTime') => {
    const h24 = to24(parseInt(hVal, 10), pVal);
    form.setValue(field, `${String(h24).padStart(2, '0')}:${mVal}`);
    setEditing(null);
  };

  const openEditor = (field: 'start' | 'end', current: string) => {
    const p = parseTime(current);
    if (p) {
      const { h12, mer } = to12(p.h24);
      setHVal(String(h12).padStart(2, '0'));
      setMVal(String(p.m).padStart(2, '0'));
      setPVal(mer);
    } else {
      setHVal('09'); setMVal('00'); setPVal('AM');
    }
    setEditing(field);
  };

  const toggleMeridiem = (field: 'startTime' | 'endTime') => {
    const current = form.getValues(field);
    const p = parseTime(current);
    if (!p) return;
    const h = p.h24 < 12 ? p.h24 + 12 : p.h24 - 12;
    form.setValue(field, `${String(h).padStart(2, '0')}:${String(p.m).padStart(2, '0')}`);
  };

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
    <div className="bg-rosewood/[0.02] border border-rosewood/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-rosewood/40" />
        <p className="text-xs font-bold text-rosewood/30">
          {isTamil ? 'நேரம்' : 'Time'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Start time chip */}
        <div className="relative" ref={editing === 'start' ? inputRef : undefined}>
          {editing === 'start' ? (
            <div className="flex items-stretch bg-white border-2 border-gold rounded-xl overflow-hidden shadow-lg shadow-gold/10">
              <div className="flex items-stretch">
                {[HOURS, MINUTES].map((opts, si) => (
                  <React.Fragment key={si}>
                    {si > 0 && <div className="w-px self-stretch my-2 bg-gold/20" />}
                    <div className="relative">
                      <button
                        type="button"
                        className="h-9 px-2.5 text-xs font-bold text-rosewood bg-transparent flex items-center gap-1 hover:bg-gold/5 transition-colors"
                        onClick={() => {}}
                      >
                        <span className="tabular-nums">{si === 0 ? hVal : mVal}</span>
                        <ChevronDown size={12} className="text-rosewood/30" />
                      </button>
                      <div className="absolute left-0 top-full mt-0.5 z-50 bg-white border border-rosewood/10 rounded-xl shadow-xl max-h-[180px] overflow-y-auto min-w-[60px] p-1">
                        {opts.map(o => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => si === 0 ? setHVal(o) : setMVal(o)}
                            className={`w-full text-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              (si === 0 ? hVal : mVal) === o
                                ? 'bg-rosewood/10 text-rosewood font-bold'
                                : 'text-rosewood/60 hover:bg-rosewood/5'
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                <div className="w-px self-stretch my-2 bg-gold/20" />
                <div className="relative">
                  <button
                    type="button"
                    className={`h-9 px-2.5 text-xs font-bold flex items-center gap-1 transition-colors ${
                      pVal === 'AM' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                    }`}
                    onClick={() => setPVal(p => p === 'AM' ? 'PM' : 'AM')}
                  >
                    {pVal === 'AM' ? <Sun size={12} /> : <Moon size={12} />}
                    <span>{pVal}</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => applyTime('startTime')}
                className="px-3 bg-rosewood text-white text-xs font-bold flex items-center gap-1 hover:bg-rosewood/90 transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openEditor('start', startTime || '')}
              className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all ${
                errors.startTime
                  ? 'border-red-400 bg-red-50'
                  : startTime
                    ? 'border-gold/30 bg-gold/5 hover:border-gold'
                    : 'border-dashed border-rosewood/20 bg-transparent hover:border-rosewood/40'
              }`}
            >
              <Clock size={14} className={startTime ? 'text-gold' : 'text-rosewood/30'} />
              <span className={`text-sm font-black tabular-nums ${startTime ? 'text-rosewood' : 'text-rosewood/30'}`}>
                {startTime ? fmt12(startTime) : (isTamil ? 'தொடக்கம்' : 'Start')}
              </span>
              {startTime && (
                <span className="text-xs text-rosewood/30 group-hover:text-rosewood/60 font-bold transition-colors">
                  {isTamil ? 'தொகு' : 'edit'}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Duration arrow */}
        <div className="flex items-center gap-2 px-2 self-center">
          <div className="h-px w-4 bg-rosewood/20 hidden sm:block" />
          <span className="text-[11px] font-bold text-rosewood/40 tabular-nums whitespace-nowrap flex items-center gap-1">
            <ArrowRight size={13} className="text-rosewood/30" />
            {durationMinutes > 0
              ? `${durationMinutes >= 60 ? (durationMinutes / 60).toFixed(1) : durationMinutes}${durationMinutes >= 60 ? (isTamil ? 'ம' : 'h') : (isTamil ? 'நி' : 'm')}`
              : ''}
          </span>
          <div className="h-px w-4 bg-rosewood/20 hidden sm:block" />
        </div>

        {/* End time chip */}
        <div className="relative" ref={editing === 'end' ? inputRef : undefined}>
          {editing === 'end' ? (
            <div className="flex items-stretch bg-white border-2 border-gold rounded-xl overflow-hidden shadow-lg shadow-gold/10">
              <div className="flex items-stretch">
                {[HOURS, MINUTES].map((opts, si) => (
                  <React.Fragment key={si}>
                    {si > 0 && <div className="w-px self-stretch my-2 bg-gold/20" />}
                    <div className="relative">
                      <button
                        type="button"
                        className="h-9 px-2.5 text-xs font-bold text-rosewood bg-transparent flex items-center gap-1 hover:bg-gold/5 transition-colors"
                      >
                        <span className="tabular-nums">{si === 0 ? hVal : mVal}</span>
                        <ChevronDown size={12} className="text-rosewood/30" />
                      </button>
                      <div className="absolute left-0 top-full mt-0.5 z-50 bg-white border border-rosewood/10 rounded-xl shadow-xl max-h-[180px] overflow-y-auto min-w-[60px] p-1">
                        {opts.map(o => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => si === 0 ? setHVal(o) : setMVal(o)}
                            className={`w-full text-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              (si === 0 ? hVal : mVal) === o
                                ? 'bg-rosewood/10 text-rosewood font-bold'
                                : 'text-rosewood/60 hover:bg-rosewood/5'
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                <div className="w-px self-stretch my-2 bg-gold/20" />
                <div className="relative">
                  <button
                    type="button"
                    className={`h-9 px-2.5 text-xs font-bold flex items-center gap-1 transition-colors ${
                      pVal === 'AM' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                    }`}
                    onClick={() => setPVal(p => p === 'AM' ? 'PM' : 'AM')}
                  >
                    {pVal === 'AM' ? <Sun size={12} /> : <Moon size={12} />}
                    <span>{pVal}</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => applyTime('endTime')}
                className="px-3 bg-rosewood text-white text-xs font-bold flex items-center gap-1 hover:bg-rosewood/90 transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openEditor('end', endTime || '')}
              className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all ${
                errors.endTime
                  ? 'border-red-400 bg-red-50'
                  : endTime
                    ? 'border-gold/30 bg-gold/5 hover:border-gold'
                    : 'border-dashed border-rosewood/20 bg-transparent hover:border-rosewood/40'
              }`}
            >
              <Clock size={14} className={endTime ? 'text-gold' : 'text-rosewood/30'} />
              <span className={`text-sm font-black tabular-nums ${endTime ? 'text-rosewood' : 'text-rosewood/30'}`}>
                {endTime ? fmt12(endTime) : (isTamil ? 'முடிவு' : 'End')}
              </span>
              {endTime && (
                <span className="text-xs text-rosewood/30 group-hover:text-rosewood/60 font-bold transition-colors">
                  {isTamil ? 'தொகு' : 'edit'}
                </span>
              )}
            </button>
          )}
        </div>

        {/* AM/PM quick toggle when both set */}
        {parsedStart && parsedEnd && !editing && (
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              onClick={() => toggleMeridiem('startTime')}
              className="p-1.5 rounded-lg hover:bg-rosewood/5 transition-colors"
              title={isTamil ? 'தொடக்க நேர AM/PM' : 'Toggle start AM/PM'}
            >
              {parsedStart.h24 < 12 ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-indigo-400" />}
            </button>
            <button
              type="button"
              onClick={() => toggleMeridiem('endTime')}
              className="p-1.5 rounded-lg hover:bg-rosewood/5 transition-colors"
              title={isTamil ? 'முடிவு நேர AM/PM' : 'Toggle end AM/PM'}
            >
              {parsedEnd.h24 < 12 ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-indigo-400" />}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="text-[10px] text-rosewood/40 font-medium">
          {isTamil ? 'மாற்றங்களை உறுதிப்படுத்த ✔ பொத்தானை அழுத்தவும்' : 'Press ✔ to confirm, click outside to cancel'}
        </div>
      )}

      {errors.startTime && !editing && (
        <p className="text-[10px] text-red-500">{errors.startTime.message}</p>
      )}

      {/* Booked slots */}
      {bookedSlots.length > 0 && (
        <div className="pt-2 border-t border-rosewood/5">
          <div className="flex flex-wrap gap-1.5">
            {bookedSlots.map((slot, i) => {
              const sP = parseTime(slot.startTime);
              const eP = parseTime(slot.endTime);
              const label = sP && eP ? `${fmt12(slot.startTime)} → ${fmt12(slot.endTime)}` : `${slot.startTime} → ${slot.endTime}`;
              return (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rosewood/5 rounded-lg text-[9px] font-bold text-rosewood/50 border border-rosewood/10">
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
