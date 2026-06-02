import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../../../../context/LanguageContext';
import { ActionPanel } from '@/components/features/admin/mandapam/ActionPanel';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminCalendar } from '@/queries/useMandapamQueries';
import {
    getTamilDateInfo,
    CALENDAR_THEME,
    type CalendarStatus
} from '@/constants/calendar';
import type { CalendarEntry } from '@/types/mandapam';

const HallAvailability: React.FC = () => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDays, setSelectedDays] = React.useState<number[]>([]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const from = new Date(year, month, 1).toLocaleDateString('en-CA');
    const to = new Date(year, month + 1, 0).toLocaleDateString('en-CA');
    const { data: calendarData, isLoading, refetch: refreshCalendar } = useAdminCalendar(from, to);
    const entries = (calendarData?.entries ?? []) as CalendarEntry[];

    const dateEntryMap = useMemo(() => {
        const map = new Map<string, CalendarEntry>();
        for (const e of entries) {
            map.set(e.date.split('T')[0], e);
        }
        return map;
    }, [entries]);

    const { fullyBookedDays, partiallyBookedDays, blockedDays } = useMemo(() => {
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const fb: number[] = [];
        const pb: number[] = [];
        const bl: number[] = [];
        for (const e of entries) {
            const [y, m, d] = e.date.split('-').map(Number);
            if (y !== currentYear || m !== currentMonth) continue;
            if (e.status === 'FULLY_BOOKED') fb.push(d);
            else if (e.status === 'PARTIALLY_BOOKED') pb.push(d);
            else if (e.status === 'BLOCKED') bl.push(d);
        }
        return { fullyBookedDays: fb, partiallyBookedDays: pb, blockedDays: bl };
    }, [entries, currentDate]);

    const getDayEntryStatus = (day: number): 'AVAILABLE' | 'PARTIALLY_BOOKED' | 'FULLY_BOOKED' | 'BLOCKED' => {
        const dateStr = new Date(year, month, day).toLocaleDateString('en-CA');
        const entry = dateEntryMap.get(dateStr);
        if (!entry) return 'AVAILABLE';
        if (entry.status === 'BLOCKED') return 'BLOCKED';
        if (entry.status === 'PARTIALLY_BOOKED') return 'PARTIALLY_BOOKED';
        if (entry.status === 'FULLY_BOOKED') return 'FULLY_BOOKED';
        return 'AVAILABLE';
    };

    const handleToggleDay = (day: number) => {
        setSelectedDays(prev => {
            const hasNonAvail = prev.some(d => getDayEntryStatus(d) !== 'AVAILABLE');
            const clickingNonAvail = ['BLOCKED', 'FULLY_BOOKED'].includes(getDayEntryStatus(day));

            if ((clickingNonAvail && !hasNonAvail && prev.length > 0) ||
                (!clickingNonAvail && hasNonAvail)) {
                return [day];
            }

            const idx = prev.indexOf(day);
            if (idx !== -1) return prev.filter(d => d !== day);
            if (prev.length >= 2) return [prev[1], day];
            return [...prev, day];
        });
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDays([]);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDays([]);
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = new Date(year, month, 1).getDay();
    const endOffset = (7 - ((startOffset + daysInMonth) % 7)) % 7;
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const localizedMonthName = new Intl.DateTimeFormat(
        language === 'ta' ? 'ta-IN' : 'en-US',
        { month: 'long' }
    ).format(currentDate);

    const startTamil = getTamilDateInfo(new Date(year, month, 1));
    const endTamil = getTamilDateInfo(new Date(year, month, daysInMonth));
    const tamilMonthsRange = startTamil.nameTa !== endTamil.nameTa
        ? `${startTamil.nameTa} - ${endTamil.nameTa}`
        : startTamil.nameTa;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const selectedDateObjs = useMemo(() => selectedDays.map(d => new Date(year, month, d)), [selectedDays, year, month]);
    const handleRefresh = useCallback(() => { refreshCalendar(); }, [refreshCalendar]);
    const handleClearSelection = useCallback(() => setSelectedDays([]), []);
    const handleRemoveDate = useCallback((date: Date) => setSelectedDays(prev => prev.filter(d => d !== date.getDate())), []);

    const daysOfWeek = isTamil
        ? ['ஞாயி', 'திங்', 'செவ்', 'புத', 'வியா', 'வெள்', 'சனி']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-linear-to-br from-rosewood/5 via-ivory to-rosewood/5 rounded-2xl border border-gold/10 p-8">
                <div className="w-12 h-12 rounded-2xl bg-rosewood/10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-rosewood animate-spin" />
                </div>
                <p className="text-rosewood/60 font-black text-xs uppercase tracking-[0.2em]">
                    {isTamil ? 'கிடைக்கும் நாட்கள் ஏற்றுகிறது...' : 'Loading availability...'}
                </p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
            <div className="bg-linear-to-br from-ivory via-gold-soft/5 to-ivory backdrop-blur-xl border-2 border-gold/20 rounded-2xl p-3 md:p-8">
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-between w-full max-w-2xl mb-6 px-1">
                        <button
                            onClick={handlePrevMonth}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-rosewood/15 to-rosewood/5 text-rosewood hover:from-rosewood hover:to-dark-rosewood hover:text-ivory border border-rosewood/20 hover:border-rosewood transition-all active:scale-95"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="text-center px-3">
                            <h3 className="font-heading text-2xl md:text-3xl font-black text-rosewood leading-tight">
                                {localizedMonthName} {year}
                            </h3>
                            <p className="text-[10px] md:text-xs font-black text-gold-accent tracking-[0.15em] mt-1.5 uppercase">
                                {tamilMonthsRange}
                            </p>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-rosewood/15 to-rosewood/5 text-rosewood hover:from-rosewood hover:to-dark-rosewood hover:text-ivory border border-rosewood/20 hover:border-rosewood transition-all active:scale-95"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-5 text-[9px] md:text-[10px] font-bold text-rosewood/50">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-sm ${CALENDAR_THEME.selected.legend}`} />
                            <span>{t('adminMandapam.calendar.selected') || 'Selected'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-sm ${CALENDAR_THEME.booked.legend}`} />
                            <span>{t('adminMandapam.calendar.booked') || 'Booked'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-sm ${CALENDAR_THEME.partiallyBooked.legend}`} />
                            <span>{t('adminMandapam.calendar.partiallyBooked') || (isTamil ? 'பகுதியாக முன்பதிவு' : 'Partial')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-sm ${CALENDAR_THEME.available.legend}`} />
                            <span>{t('adminMandapam.calendar.available') || 'Available'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-sm ${CALENDAR_THEME.blocked.legend}`} />
                            <span>{t('adminMandapam.calendar.blocked') || 'Blocked'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-sm ${CALENDAR_THEME.today.legend}`} />
                            <span>{t('adminMandapam.calendar.today') || (isTamil ? 'இன்று' : 'Today')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px w-full max-w-2xl bg-gold/20 rounded-xl overflow-hidden">
                        {daysOfWeek.map((d: string) => (
                            <div key={d} className="text-center py-2 text-[9px] md:text-[10px] font-black text-rosewood/50 uppercase tracking-[0.12em] bg-white/60">
                                {d}
                            </div>
                        ))}
                        {Array.from({ length: startOffset }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square bg-stone-100/40" />
                        ))}

                        {days.map((day, idx) => {
                            const dateObj = new Date(year, month, day);

                            const isPast = dateObj.getTime() < todayDate.getTime();
                            const isFullyBooked = fullyBookedDays.includes(day);
                            const isPartiallyBooked = partiallyBookedDays.includes(day);
                            const isBlocked = blockedDays.includes(day);
                            const isSelected = selectedDays.includes(day);
                            const isToday = todayDate.getTime() === dateObj.getTime();
                            const isDisabled = isPast;

                            const tInfo = getTamilDateInfo(dateObj);
                            const showTamilLabel = day === 1 || tInfo.tDate === 1;

                            let status: CalendarStatus = 'available';
                            if (isBlocked) status = 'blocked';
                            else if (isSelected) status = 'selected';
                            else if (isFullyBooked) status = 'booked';
                            else if (isPartiallyBooked) status = 'partiallyBooked';
                            else if (isPast) status = 'disabled';
                            if (isToday && status === 'available') status = 'today';

                            const theme = CALENDAR_THEME[status];
                            const isClickable = !isDisabled;

                            return (
                                <motion.button
                                    key={day}
                                    onClick={() => {
                                        if (isDisabled) return;
                                        handleToggleDay(day);
                                    }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.25, delay: (idx % 14) * 0.03 }}
                                    disabled={isDisabled}
                                    className={`aspect-square relative flex flex-col items-center justify-center transition-all rounded-sm ${theme.cell} ${isClickable ? 'active:scale-90 cursor-pointer' : 'cursor-default'}`}
                                >
                                    <span className={`font-heading text-lg md:text-2xl font-black leading-none ${theme.textMain}`}>
                                        {day}
                                    </span>
                                    <span className={`absolute top-0.5 right-1 leading-none ${theme.textSub} text-[9px] md:text-xs font-black`}>
                                        {tInfo.tDate}
                                    </span>
                                    {showTamilLabel && (
                                        <span className={`absolute bottom-0.5 left-1 leading-none max-w-[90%] truncate ${theme.textTa} text-[7px] md:text-[10px] font-black`}>
                                            {tInfo.nameTa}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}

                        {Array.from({ length: endOffset }).map((_, i) => (
                            <div key={`empty-end-${i}`} className="aspect-square bg-stone-100/40" />
                        ))}
                    </div>
                </div>
            </div>

            <ActionPanel t={t} language={language} selectedDates={selectedDateObjs} entries={entries} onRefresh={handleRefresh} onClearSelection={handleClearSelection} onRemoveDate={handleRemoveDate} />
        </motion.div>
    );
};

export default HallAvailability;
