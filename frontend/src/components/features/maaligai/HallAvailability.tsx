import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { packages as enPackages } from '@/locales/en/maaligai/packages';
import { packages as taPackages } from '@/locales/ta/maaligai/packages';
import {
    getTamilDateInfo,
    CALENDAR_THEME,
    type CalendarStatus
} from '@/constants/calendar';

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

interface AvailabilityCalendarProps {}

export const SharedCalendar: React.FC<SharedCalendarProps> = ({
    currentDate, onPrevMonth, onNextMonth, selectedDay, onSelectDay,
    bookedDays, blockedDays = [], isAdmin = false, language, legend, daysOfWeek
}) => {
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const fontDecorative = 'font-decorative';
    const fontDisplay = isTamil ? 'font-tamil-serif' : 'font-heading';

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
        <div className="ha-calendar bg-background-light rounded-xl md:rounded-2xl p-1 sm:p-3 md:p-5 border border-gold-accent/40 shadow-lg w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col items-center mb-6 md:mb-8 w-full"
            >
                <div className="flex items-center justify-between w-full px-2 sm:px-8">
                    <button
                        onClick={onPrevMonth}
                        disabled={isPrevDisabled}
                        className={`btn-shine flex items-center justify-center p-1 md:p-2 border-2 rounded-full transition-transform ${isPrevDisabled
                            ? 'border-gray-300 text-gray-300 cursor-not-allowed'
                            : 'border-gold-accent hover:scale-110'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-lg! md:text-3xl! ${isPrevDisabled ? "" : "text-gradient-logo"}`}>chevron_left</span>
                    </button>

                    <div className="text-center px-2">
                        <h3 className={`${fontSerif} ${ls('text-[1rem] sm:text-2xl md:text-3xl', 'text-[1rem] sm:text-2xl md:text-3xl')} font-bold text-rosewood mb-1 md:mb-2`}>
                            {localizedMonthName} {year}
                        </h3>
                        <p className={`${fontDecorative} ${ls('text-[0.6rem] sm:text-xs md:text-base', 'text-[0.6rem] sm:text-xs md:text-base')} tracking-normal text-rosewood/80`}>
                            {tamilMonthsRange}
                        </p>
                    </div>

                    <button onClick={onNextMonth} className="btn-shine flex items-center justify-center p-1 md:p-2 border-2 border-gold-accent rounded-full hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-lg! md:text-3xl! text-gradient-logo">chevron_right</span>
                    </button>
                </div>

                <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 mt-2 md:mt-4 text-[8px] sm:text-[10px] md:text-xs ${isTamil ? 'tracking-normal' : 'uppercase tracking-widest'} font-bold text-gray-500 border-b border-t w-full border-sage-green/70 p-3`}>
                    <div className="flex items-center gap-1.5 md:gap-2.5">
                        <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full ${CALENDAR_THEME.selected.legend}`}></span>
                        <span className={CALENDAR_THEME.selected.legendText || ""}>{legend.selected}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2.5">
                        <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full ${CALENDAR_THEME.booked.legend}`}></span>
                        <span className={CALENDAR_THEME.booked.legendText || ""}>{legend.booked}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2.5">
                        <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full ${CALENDAR_THEME.available.legend}`}></span>
                        <span className={CALENDAR_THEME.available.legendText || ""}>{legend.available}</span>
                    </div>
                    {legend.blocked && (
                        <div className="flex items-center gap-1.5 md:gap-2.5">
                            <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full ${CALENDAR_THEME.blocked.legend}`}></span>
                            <span className={CALENDAR_THEME.blocked.legendText || ""}>{legend.blocked}</span>
                        </div>
                    )}
                    {legend.today && (
                        <div className="flex items-center gap-1.5 md:gap-2.5">
                            <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full ${CALENDAR_THEME.today.legend}`}></span>
                            <span className={CALENDAR_THEME.today.legendText || ""}>{legend.today}</span>
                        </div>
                    )}
                    {legend.disabled && (
                        <div className="flex items-center gap-1.5 md:gap-2.5">
                            <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full ${CALENDAR_THEME.disabled.legend}`}></span>
                            <span className={CALENDAR_THEME.disabled.legendText || ""}>{legend.disabled}</span>
                        </div>
                    )}
                    {selectedDay && legend.clear && (
                        <div className="flex items-center">
                            <button
                                onClick={() => onSelectDay(null)}
                                className={`btn-shine px-2 py-1 md:px-3 md:py-1.5 rounded-md font-bold text-[9px] md:text-[11px] ${isTamil ? 'tracking-normal' : 'uppercase tracking-widest'} transition-all active:scale-95 text-rosewood border border-rosewood hover:bg-rosewood hover:text-white`}
                            >
                                {legend.clear}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-7 text-center">
                {daysOfWeek.map((d: string) => (
                    <span key={d} className={`${ls('text-[8px] sm:text-[10px] md:text-xs tracking-wider uppercase', 'text-[8px] sm:text-[10px] md:text-xs tracking-normal')} py-1 md:p-2 font-bold border border-sage-green/70 text-rosewood/70 bg-ivory-tint`}>{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0">
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-stone-50/50 cursor-not-allowed border border-sage-green/70" />
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
                    else if (isToday) status = 'today';

                    const theme = CALENDAR_THEME[status];

                    return (
                        <motion.button
                            key={day}
                            onClick={() => !isDisabled && onSelectDay(day)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.05 + ((idx % 10) * 0.01) }}
                            disabled={isDisabled}
                            className={`aspect-square relative flex flex-col items-center justify-center transition-all ${theme.cell} ${(!isDisabled && status !== 'booked' && status !== 'blocked') ? 'btn-shine' : ''}`}
                        >
                            {showTamilLabel && (
                                <span className={`absolute bottom-0.5 left-0.5 sm:left-1 md:bottom-1 md:left-1 ${ls('text-[7px] sm:text-[9px] md:text-xs', 'text-[7px] sm:text-[9px] md:text-xs')} font-tamil-body font-semibold leading-none max-w-[90%] ${theme.textTa}`}>
                                    {tInfo.nameTa}
                                </span>
                            )}
                             <span className={`font-heading font-bold ${ls('text-[1.125rem] sm:text-xl md:text-3xl', 'text-[1.125rem] sm:text-xl md:text-3xl')} ${theme.textMain}`}>
                                  {day}
                             </span>
                            <span className={`absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 ${ls('text-[7px] sm:text-[9px] md:text-xs', 'text-[7px] sm:text-[9px] md:text-xs')} font-sans font-semibold leading-none ${theme.textSub}`}>
                                {tInfo.tDate}
                            </span>
                        </motion.button>
                    );
                })}
                {Array.from({ length: endOffset }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="aspect-square bg-stone-50/50 cursor-not-allowed border border-sage-green/70" />
                ))}
            </div>
        </div>
    );
};

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = () => {
    const navigate = useNavigate();
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';
    const t = isTamil ? taPackages : enPackages;
    const content = t;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const bookedDays = [5, 11, 20, 21];

    const handlePrevMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDay(null);
    };

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const weight = (en: string, ta: string = 'font-bold') => isTamil ? ta : en;
    const tracking = isTamil ? 'tracking-normal' : 'tracking-widest';

    return (
        <motion.section
            id="ha-calendar"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="px-4 md:px-6 lg:px-20 section-spacing bg-white"
        >
            <div className="max-w-3xl mx-auto flex flex-col items-center">
                <div className="text-center mb-12 md:mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className={`${ls('font-heading', 'font-tamil-serif')} text-rosewood ${ls('text-2xl md:text-4xl lg:text-5xl', 'text-xl md:text-2xl lg:text-3xl')} ${weight('font-bold')} mb-4`}
                    >
                        {content.availabilityTitle}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={`text-gray-600 max-w-2xl mx-auto ${ls('font-body text-base md:text-lg', 'font-tamil-body text-sm md:text-base')} ${ls('leading-relaxed', 'leading-[1.6]')}`}
                    >
                        {content.availabilitySubtitle}
                    </motion.p>
                </div>

                <div className="w-full max-w-2xl mx-auto">
                    <div>
                        <SharedCalendar
                            currentDate={currentDate}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            selectedDay={selectedDay}
                            onSelectDay={setSelectedDay}
                            bookedDays={bookedDays}
                            language={lang.toLowerCase()}
                            legend={{
                                available: content.availabilityLegend.available,
                                selected: content.availabilityLegend.selected,
                                booked: content.availabilityLegend.booked,
                                today: isTamil ? 'இன்று' : 'Today',
                                disabled: isTamil ? 'கிடைக்காது' : 'Disabled',
                                clear: isTamil ? 'அழிக்க' : 'Clear'
                            }}
                            daysOfWeek={Object.values(content.availabilityDays) as string[]}
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-12 md:mt-16 text-center w-full"
                >
                    <div>
                        <button
                            className={`btn-shine w-full md:w-auto bg-rosewood hover:bg-[#701a33] text-white px-10 md:px-16 py-4 md:py-5 rounded-xl ${weight('font-bold')} transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${ls('text-xs md:text-sm uppercase', 'text-xs md:text-base')} ${tracking}`}
                            onClick={() => {
                                const dateStr = selectedDay ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay).toLocaleDateString() : '';
                                navigate('/maaligai/contact/#inquiry', { state: { subject: `Booking inquiry for ${dateStr}`, date: dateStr } });
                            }}
                            disabled={!selectedDay}
                        >
                            {content.proceedBtn}
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
};



