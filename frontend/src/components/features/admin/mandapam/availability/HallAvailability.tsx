import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { ActionPanel } from '@/components/features/admin/mandapam/ActionPanel';
import { mandapamService } from '@/services/mandapamService';
import { Loader2, CalendarDays } from 'lucide-react';
import { useAdminCalendarQuery } from '@/hooks/queries/useAdminMandapam';

// ═══════════════════════════════════════════════════════════
// SharedCalendar Subcomponent
// ═══════════════════════════════════════════════════════════

interface TamilMonth {
    nameTa: string;
    start: { month: number; day: number };
}

const TAMIL_MONTHS: TamilMonth[] = [
    { nameTa: "சித்திரை", start: { month: 3, day: 14 } },
    { nameTa: "வைகாசி", start: { month: 4, day: 15 } },
    { nameTa: "ஆனி", start: { month: 5, day: 15 } },
    { nameTa: "ஆடி", start: { month: 6, day: 16 } },
    { nameTa: "ஆவணி", start: { month: 7, day: 17 } },
    { nameTa: "புரட்டாசி", start: { month: 8, day: 17 } },
    { nameTa: "ஐப்பசி", start: { month: 9, day: 17 } },
    { nameTa: "கார்த்திகை", start: { month: 10, day: 16 } },
    { nameTa: "மார்கழி", start: { month: 11, day: 16 } },
    { nameTa: "தை", start: { month: 0, day: 14 } },
    { nameTa: "மாசி", start: { month: 1, day: 13 } },
    { nameTa: "பங்குனி", start: { month: 2, day: 14 } }
];

const getTamilDateInfo = (date: Date) => {
    const month = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();

    let currentTamilMonthIndex = -1;
    let daysSinceTamilMonthStart = 0;

    const currentGregorianMonthConfig = TAMIL_MONTHS.find(tm => tm.start.month === month);

    if (currentGregorianMonthConfig && day >= currentGregorianMonthConfig.start.day) {
        currentTamilMonthIndex = TAMIL_MONTHS.indexOf(currentGregorianMonthConfig);
        daysSinceTamilMonthStart = day - currentGregorianMonthConfig.start.day + 1;
    } else {
        const prevMonthIndex = month === 0 ? 11 : month - 1;
        const prevGregorianMonthConfig = TAMIL_MONTHS.find(tm => tm.start.month === prevMonthIndex);
        if (prevGregorianMonthConfig) {
            currentTamilMonthIndex = TAMIL_MONTHS.indexOf(prevGregorianMonthConfig);
            const prevMonthDays = new Date(year, month, 0).getDate();
            daysSinceTamilMonthStart = (prevMonthDays - prevGregorianMonthConfig.start.day + 1) + day;
        }
    }

    if (currentTamilMonthIndex === -1) {
        return { nameTa: "", tDate: "" };
    }

    return {
        nameTa: TAMIL_MONTHS[currentTamilMonthIndex].nameTa,
        tDate: daysSinceTamilMonthStart
    };
};

type CalendarStatus = 'available' | 'selected' | 'booked' | 'blocked' | 'today' | 'disabled';

const CALENDAR_THEME: Record<CalendarStatus, { legend: string; legendText?: string; cell: string; textMain: string; textSub: string; textTa: string }> = {
    available: {
        legend: "bg-white border border-stone-300",
        cell: "bg-white border-stone-300 hover:border-stone-400 hover:bg-stone-50 shadow-sm",
        textMain: "text-rosewood",
        textSub: "text-rosewood",
        textTa: "text-rosewood/70"
    },
    selected: {
        legend: "bg-rosewood border border-rosewood",
        legendText: "text-rosewood",
        cell: "bg-rosewood scale-95 z-10 border-rosewood shadow-lg",
        textMain: "text-white",
        textSub: "text-white/80",
        textTa: "text-white/90"
    },
    booked: {
        legend: "bg-sage border border-sage",
        cell: "bg-sage/20 border-sage",
        textMain: "text-rosewood",
        textSub: "text-rosewood",
        textTa: "text-rosewood/70"
    },
    blocked: {
        legend: "bg-rosewood border border-rosewood",
        legendText: "text-rosewood",
        cell: "bg-rosewood/10 border-rosewood",
        textMain: "text-rosewood",
        textSub: "text-rosewood/80",
        textTa: "text-rosewood/80"
    },
    today: {
        legend: "bg-gold/10 border border-gold",
        cell: "bg-gold/10 border-gold border-2 shadow-[0_0_10px_rgba(212,175,55,0.2)]",
        textMain: "text-rosewood font-black",
        textSub: "text-rosewood",
        textTa: "text-rosewood/70"
    },
    disabled: {
        legend: "bg-stone-50/50 border border-stone-200",
        legendText: "text-stone-400",
        cell: "bg-stone-50/50 cursor-not-allowed border-stone-200 opacity-40 grayscale",
        textMain: "text-stone-500",
        textSub: "text-stone-400/80",
        textTa: "text-stone-400"
    }
};

interface LegendProps {
    available: string;
    selected: string;
    booked: string;
    blocked?: string;
    today?: string;
    disabled?: string;
    clear?: string;
}

interface SharedCalendarProps {
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    selectedDay: number | null;
    onSelectDay: (day: number | null) => void;
    bookedDays: number[];
    blockedDays?: number[];
    isAdmin?: boolean;
    language: string;
    legend: LegendProps;
    daysOfWeek: string[];
}

const SharedCalendar: React.FC<SharedCalendarProps> = ({
    currentDate, onPrevMonth, onNextMonth, selectedDay, onSelectDay,
    bookedDays, blockedDays = [], isAdmin = false, language, legend, daysOfWeek
}) => {
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

    const startObj = getTamilDateInfo(new Date(year, month, 1));
    const endObj = getTamilDateInfo(new Date(year, month, daysInMonth));
    const tamilMonthsRange = startObj.nameTa !== endObj.nameTa
        ? `${startObj.nameTa} - ${endObj.nameTa}`
        : startObj.nameTa;

    const todayDate = new Date();
    const isPrevDisabled = !isAdmin && (year < todayDate.getFullYear() ||
        (year === todayDate.getFullYear() && month <= todayDate.getMonth()));

    return (
        <div className="ha-calendar bg-ivory/40 backdrop-blur-xl rounded-sm p-4 w-full overflow-x-auto scrollbar-thin">
            <div className="min-w-[800px]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-col items-center mb-6 w-full"
                >
                    <div className="flex items-center justify-between w-full px-2">
                        <button
                            onClick={onPrevMonth}
                            disabled={isPrevDisabled}
                            className={`group flex items-center justify-center p-2 border border-stone-200/80 rounded-sm transition-all ${isPrevDisabled
                                ? 'opacity-20 cursor-not-allowed'
                                : 'hover:bg-gold-soft/10 hover:scale-110 active:scale-95'
                                }`}
                        >
                            <span className="material-symbols-outlined text-rosewood">chevron_left</span>
                        </button>

                        <div className="text-center px-4">
                            <h3 className="text-3xl font-serif font-bold text-rosewood">
                                {localizedMonthName} {year}
                            </h3>
                            <p className="text-sm font-bold text-gold uppercase tracking-[0.2em] mt-1">
                                {tamilMonthsRange}
                            </p>
                        </div>

                        <button
                            onClick={onNextMonth}
                            className="group flex items-center justify-center p-2 border border-stone-200/80 rounded-sm hover:bg-stone-100 hover:scale-110 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-rosewood">chevron_right</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-6 py-3 border-y border-stone-200/60 w-full">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${CALENDAR_THEME.selected.legend}`} />
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${CALENDAR_THEME.selected.legendText || 'text-gray-400'}`}>{legend.selected}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${CALENDAR_THEME.booked.legend}`} />
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${CALENDAR_THEME.booked.legendText || 'text-gray-400'}`}>{legend.booked}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${CALENDAR_THEME.available.legend}`} />
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${CALENDAR_THEME.available.legendText || 'text-gray-400'}`}>{legend.available}</span>
                        </div>
                        {legend.blocked && (
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-sm ${CALENDAR_THEME.blocked.legend}`} />
                                <span className={`text-[10px] font-bold tracking-widest uppercase ${CALENDAR_THEME.blocked.legendText || 'text-gray-400'}`}>{legend.blocked}</span>
                            </div>
                        )}
                        {legend.today && (
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-sm ${CALENDAR_THEME.today.legend}`} />
                                <span className={`text-[10px] font-bold tracking-widest uppercase ${CALENDAR_THEME.today.legendText || 'text-gray-400'}`}>{legend.today}</span>
                            </div>
                        )}
                        {selectedDay && legend.clear && (
                            <button
                                onClick={() => onSelectDay(null)}
                                className="ml-2 px-3 py-1.5 rounded-sm text-[10px] font-bold text-rosewood border border-stone-200/80 hover:bg-stone-50 transition-all uppercase tracking-widest"
                            >
                                {legend.clear}
                            </button>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-7 gap-1">
                    {daysOfWeek.map((d: string) => (
                        <div key={d} className="text-center py-2 text-[10px] font-bold text-gold uppercase tracking-widest border border-gold/10 rounded-sm bg-stone-50/30">
                            {d}
                        </div>
                    ))}

                    {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-sm bg-stone-50/20" />
                    ))}

                    {days.map((day, idx) => {
                        const dateObj = new Date(year, month, day);

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const isPast = dateObj.getTime() < today.getTime();
                        const isBooked = bookedDays.includes(day);
                        const isBlocked = blockedDays.includes(day);
                        const isEffectivelyBooked = isBooked || (!isAdmin && isBlocked);
                        const isEffectivelyBlocked = isAdmin && isBlocked;
                        const isDisabled = isPast || (!isAdmin && isEffectivelyBooked);
                        const isSelected = day === selectedDay;

                        const tInfo = getTamilDateInfo(dateObj);
                        const isToday = today.getTime() === dateObj.getTime();
                        const showTamilLabel = day === 1 || tInfo.tDate === 1;

                        let status: CalendarStatus = 'available';
                        if (isEffectivelyBlocked) status = 'blocked';
                        else if (isSelected) status = 'selected';
                        else if (isEffectivelyBooked) status = 'booked';
                        else if (isPast) status = 'disabled';

                        if (isToday && status === 'available') status = 'today';

                        const theme = CALENDAR_THEME[status];

                        return (
                            <motion.button
                                key={day}
                                onClick={() => !isDisabled && onSelectDay(day)}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: (idx % 7) * 0.05 }}
                                disabled={isDisabled}
                                className={`
                                    aspect-square relative flex flex-col items-center justify-center transition-all rounded-sm border-2
                                    ${theme.cell}
                                    ${isSelected ? 'shadow-lg z-10' : ''}
                                    ${isToday ? 'ring-2 ring-gold ring-inset bg-gold/5' : ''}
                                    ${!isDisabled ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'}
                                `}
                            >
                                {showTamilLabel && (
                                    <span className={`absolute bottom-1.5 left-2 text-[8px] font-bold leading-none ${theme.textTa}`}>
                                        {tInfo.nameTa}
                                    </span>
                                )}
                                <span className={`font-serif text-2xl ${theme.textMain} ${isToday ? 'font-black' : 'font-bold'}`}>
                                    {day}
                                </span>
                                <span className={`absolute top-1.5 right-2 text-[12px] font-bold leading-none ${theme.textSub}`}>
                                    {tInfo.tDate}
                                </span>
                            </motion.button>
                        );
                    })}

                    {Array.from({ length: endOffset }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="aspect-square rounded-sm bg-stone-50/20" />
                    ))}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// HallAvailability (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const HallAvailability: React.FC = () => {
    const { t, language } = useLanguage();
    const isTamil = language === 'ta';
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

    const { data: bookedDates = [], isLoading } = useAdminCalendarQuery();

    const bookedDays = React.useMemo(() => {
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        return bookedDates.filter((item: any) => {
            if (item.type !== 'BOOKED') return false;
            const [year, month] = item.date.split('-').map(Number);
            return year === currentYear && month === currentMonth;
        }).map((item: any) => parseInt(item.date.split('-')[2]));
    }, [bookedDates, currentDate]);

    const blockedDays = React.useMemo(() => {
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        return bookedDates.filter((item: any) => {
            if (item.type !== 'BLOCKED') return false;
            const [year, month] = item.date.split('-').map(Number);
            return year === currentYear && month === currentMonth;
        }).map((item: any) => parseInt(item.date.split('-')[2]));
    }, [bookedDates, currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDay(null);
    };

    const selectedDateObj = selectedDay ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay) : null;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 text-rosewood animate-spin" />
                <p className="text-slate-500 font-medium">{isTamil ? 'கிடைக்கும் நாட்கள் ஏற்றுகிறது...' : 'Loading availability...'}</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 md:space-y-10">
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_20px_60px_-15px_rgba(139,29,61,0.12)] p-4 md:p-8 overflow-x-auto scrollbar-thin min-w-0">
                <SharedCalendar currentDate={currentDate} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} selectedDay={selectedDay} onSelectDay={setSelectedDay} bookedDays={bookedDays} blockedDays={blockedDays} isAdmin={true} language={language} legend={{
                    available: t('adminMandapam.calendar.available') || 'Available',
                    selected: t('adminMandapam.calendar.selected') || 'Selected',
                    booked: t('adminMandapam.calendar.booked') || 'Booked',
                    blocked: t('adminMandapam.calendar.blocked') || 'Blocked',
                    today: t('adminMandapam.calendar.today') || (isTamil ? 'இன்று' : 'Today'),
                    disabled: t('adminMandapam.calendar.disabled') || (isTamil ? 'கிடைக்கவில்லை' : 'Disabled'),
                    clear: isTamil ? 'அழிக்க' : 'Clear'
                }} daysOfWeek={[t('common.days.sun') || 'Sun', t('common.days.mon') || 'Mon', t('common.days.tue') || 'Tue', t('common.days.wed') || 'Wed', t('common.days.thu') || 'Thu', t('common.days.fri') || 'Fri', t('common.days.sat') || 'Sat']} />
            </div>
            <ActionPanel t={t} language={language} selectedDate={selectedDateObj} />
        </motion.div>
    );
};

export default HallAvailability;
