import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { ActionPanel } from '@/components/features/admin/mandapam/ActionPanel';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminGetCalendar } from '@/api/mandapam.api';
import { getTamilDateInfo, type CalendarStatus } from '@/constants/calendar';

const CALENDAR_THEME: Record<CalendarStatus, { cell: string; chip: string }> = {
    available: {
        cell: "bg-white/90 border-gold/20 hover:bg-linear-to-br hover:from-gold-soft/20 hover:to-gold-soft/5 hover:border-gold-accent",
        chip: "bg-white border-gold/20",
    },
    selected: {
        cell: "bg-linear-to-br from-gold-accent to-gold border-gold-accent ring-2 ring-gold/30 scale-[0.95] z-10",
        chip: "bg-linear-to-br from-gold-accent to-gold border-gold-accent",
    },
    booked: {
        cell: "bg-sage/10 border-sage/30",
        chip: "bg-sage/20 border-sage/30",
    },
    blocked: {
        cell: "bg-linear-to-br from-rosewood/10 to-rosewood/5 border-rosewood/30",
        chip: "bg-linear-to-br from-rosewood/15 to-rosewood/5 border-rosewood/30",
    },
    today: {
        cell: "bg-linear-to-br from-gold/10 to-ivory border-gold border-2",
        chip: "bg-linear-to-br from-gold/10 to-gold/20 border-gold",
    },
    disabled: {
        cell: "bg-stone-50/50 cursor-not-allowed border-stone-200 opacity-30 grayscale",
        chip: "bg-stone-50 border-stone-200",
    }
};

const HallAvailability: React.FC = () => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDays, setSelectedDays] = React.useState<number[]>([]);

    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const from = new Date(y, m, 1).toLocaleDateString('en-CA');
        const to = new Date(y, m + 1, 0).toLocaleDateString('en-CA');
        adminGetCalendar(from, to).then(res => setEntries(res.entries)).finally(() => setIsLoading(false));
    }, [currentDate]);

    const bookedDays = React.useMemo(() => {
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        return entries.filter((e: any) => {
            if (e.status !== 'FULLY_BOOKED' && e.status !== 'PARTIALLY_BOOKED') return false;
            const [year, month] = e.date.split('-').map(Number);
            return year === currentYear && month === currentMonth;
        }).map((e: any) => parseInt(e.date.split('-')[2]));
    }, [entries, currentDate]);

    const blockedDays = React.useMemo(() => {
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        return entries.filter((e: any) => {
            if (e.status !== 'BLOCKED') return false;
            const [year, month] = e.date.split('-').map(Number);
            return year === currentYear && month === currentMonth;
        }).map((e: any) => parseInt(e.date.split('-')[2]));
    }, [entries, currentDate]);

    const getDayEntryStatus = (day: number): 'AVAILABLE' | 'BOOKED' | 'BLOCKED' => {
        const dateStr = new Date(year, month, day).toLocaleDateString('en-CA');
        const entry = entries.find((e: any) => e.date.split('T')[0] === dateStr);
        if (!entry) return 'AVAILABLE';
        if (entry.status === 'BLOCKED') return 'BLOCKED';
        if (entry.status === 'FULLY_BOOKED' || entry.status === 'PARTIALLY_BOOKED') return 'BOOKED';
        return 'AVAILABLE';
    };

    const handleToggleDay = (day: number) => {
        setSelectedDays(prev => {
            const hasNonAvail = prev.some(d => getDayEntryStatus(d) !== 'AVAILABLE');
            const clickingNonAvail = ['BLOCKED', 'BOOKED'].includes(getDayEntryStatus(day));

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

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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

    const selectedDateObjs = selectedDays.map(d => new Date(year, month, d));

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

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-6 py-3 px-4 bg-white/40 backdrop-blur-sm rounded-xl border border-gold/10 w-full max-w-2xl">
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-sm ${CALENDAR_THEME.selected.chip}`} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-rosewood/50">
                                {t('adminMandapam.calendar.selected') || 'Selected'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-sm ${CALENDAR_THEME.booked.chip}`} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-rosewood/50">
                                {t('adminMandapam.calendar.booked') || 'Booked'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-sm ${CALENDAR_THEME.available.chip}`} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-rosewood/50">
                                {t('adminMandapam.calendar.available') || 'Available'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-sm ${CALENDAR_THEME.blocked.chip}`} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-rosewood/50">
                                {t('adminMandapam.calendar.blocked') || 'Blocked'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-sm ${CALENDAR_THEME.today.chip}`} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-rosewood/50">
                                {t('adminMandapam.calendar.today') || (isTamil ? 'இன்று' : 'Today')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px sm:gap-1 w-full max-w-2xl bg-gold/5 rounded-xl overflow-hidden p-px">
                        {daysOfWeek.map((d: string) => (
                            <div key={d} className="text-center py-2 text-[9px] md:text-[10px] font-black text-gold-accent uppercase tracking-[0.12em] bg-rosewood/5 border border-rosewood/10 rounded-lg m-px">
                                {d}
                            </div>
                        ))}
                        {Array.from({ length: startOffset }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square rounded-lg bg-white/40 m-px" />
                        ))}

                        {Array.from({ length: startOffset }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square rounded-lg" />
                        ))}

                        {days.map((day, idx) => {
                            const dateObj = new Date(year, month, day);

                            const isPast = dateObj.getTime() < todayDate.getTime();
                            const isBooked = bookedDays.includes(day);
                            const isBlocked = blockedDays.includes(day);
                            const isSelected = selectedDays.includes(day);
                            const isToday = todayDate.getTime() === dateObj.getTime();
                            const isDisabled = isPast;

                            const tInfo = getTamilDateInfo(dateObj);
                            const showTamilLabel = day === 1 || tInfo.tDate === 1;

                            let status: CalendarStatus = 'available';
                            if (isBlocked) status = 'blocked';
                            else if (isSelected) status = 'selected';
                            else if (isBooked) status = 'booked';
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
                                    className={`aspect-square relative flex flex-col items-center justify-center transition-all rounded-xl border-2 ${theme.cell} ${isClickable ? 'active:scale-90 cursor-pointer' : 'cursor-default'} m-px`}
                                >
                                    <span className={`font-heading text-lg md:text-2xl font-black leading-none ${status === 'selected' ? 'text-ivory' : status === 'disabled' ? 'text-stone-400' : 'text-rosewood'}`}>
                                        {day}
                                    </span>
                                    <span className={`absolute top-0.5 right-1 leading-none ${status === 'selected' ? 'text-ivory/80' : status === 'disabled' ? 'text-stone-400/60' : 'text-rosewood/60'} text-[9px] md:text-xs font-black`}>
                                        {tInfo.tDate}
                                    </span>
                                    {showTamilLabel && (
                                        <span className={`absolute bottom-0.5 left-1 leading-none max-w-[90%] truncate ${status === 'selected' ? 'text-ivory/70' : status === 'disabled' ? 'text-stone-400/50' : 'text-rosewood/50'} text-[7px] md:text-[10px] font-black`}>
                                            {tInfo.nameTa}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}

                        {Array.from({ length: endOffset }).map((_, i) => (
                            <div key={`empty-end-${i}`} className="aspect-square rounded-lg bg-white/40 m-px" />
                        ))}
                    </div>
                </div>
            </div>

            <ActionPanel t={t} language={language} selectedDates={selectedDateObjs} entries={entries} onRefresh={() => adminGetCalendar().then(res => setEntries(res.entries))} onClearSelection={() => setSelectedDays([])} onRemoveDate={(date) => setSelectedDays(prev => prev.filter(d => d !== date.getDate()))} />
        </motion.div>
    );
};

export default HallAvailability;
