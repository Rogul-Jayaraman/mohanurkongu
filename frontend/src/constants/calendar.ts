export interface TamilMonth {
    nameTa: string;
    start: { month: number; day: number };
}

export const TAMIL_MONTHS: TamilMonth[] = [
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

export type CalendarStatus = 'available' | 'selected' | 'booked' | 'blocked' | 'today' | 'disabled';

export const CALENDAR_THEME: Record<CalendarStatus, { legend: string; legendText?: string; cell: string; textMain: string; textSub: string; textTa: string }> = {
    available: {
        legend: "bg-white border border-sage-green/70",
        cell: "bg-white border border-sage-green/70 hover:border-primary hover:bg-primary/20 shadow-sm",
        textMain: "text-rosewood",
        textSub: "text-rosewood",
        textTa: "text-rosewood/70"
    },
    selected: {
        legend: "bg-rose-beige border border-rose-beige",
        legendText: "text-rosewood",
        cell: "bg-rose-beige scale-95 z-10 border border-rose-beige",
        textMain: "text-rosewood",
        textSub: "text-rosewood/80",
        textTa: "text-rosewood/90"
    },
    booked: {
        legend: "bg-sage-green/90 border border-rosewood/70",
        cell: "bg-sage-green/90 border border-rosewood/70",
        textMain: "text-rosewood",
        textSub: "text-rosewood",
        textTa: "text-rosewood/70"
    },
    blocked: {
        legend: "bg-rosewood border border-rosewood/70",
        legendText: "text-rosewood",
        cell: "bg-rosewood border border-rosewood/70",
        textMain: "text-white",
        textSub: "text-white/80",
        textTa: "text-white/80"
    },
    today: {
        legend: "bg-primary border border-rosewood/70",
        cell: "bg-primary border border-rosewood/70 shadow-inner",
        textMain: "text-rosewood",
        textSub: "text-rosewood",
        textTa: "text-rosewood/70"
    },
    disabled: {
        legend: "bg-stone-50/50 border border-stone-200",
        legendText: "text-stone-400",
        cell: "bg-stone-50/50 cursor-not-allowed border border-stone-200 opacity-40 grayscale",
        textMain: "text-stone-500",
        textSub: "text-stone-400/80",
        textTa: "text-stone-400"
    }
};

export const getTamilDateInfo = (date: Date) => {
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
