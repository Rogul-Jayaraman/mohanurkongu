import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCalendarDayPipeline } from '@/pipelines/mandapam/calendar.pipeline';
import { queryKeys } from '@/queries/queryKeys';
import { useCalendarDay } from '@/queries/useMandapamQueries';
import { useBlockDates, useUnblockDates } from '@/queries/useMandapamMutations';
import { formatCurrency } from '@/utils/format';
import {
    Calendar as CalendarIcon,
    Info,
    CheckCircle,
    Trash2,
    Clock,
    PlusCircle,
    X,
    User,
    Tag,
    FileText,
    Loader2,
    Receipt,
    Eye,
} from 'lucide-react';
import { BlockDatesModal } from '@/modals/admin/BlockDatesModal';
import { getTamilDateInfo } from '@/constants/calendar';
import { getBookingStatusStyle } from '@/constants/admin/statusColors';
import { fmt12 } from '@/utils/time';
import { SectionCard3D, SectionHeaderRedesigned, DetailRow, SectionDivider } from '@/components/features/matrimony/ProfileViewPrimitives';
import type { BookingType, CalendarEntry, CalendarEntryStatus } from '@/types/mandapam';
import type { CalendarDayOutput } from '@/pipelines/mandapam/context.types';

interface ActionPanelProps {
    t: any;
    language: string;
    selectedDates: Date[];
    entries: CalendarEntry[];
    onRefresh: () => void;
    onClearSelection?: () => void;
    onRemoveDate?: (date: Date) => void;
}

const STATUS_STYLES: Record<CalendarEntryStatus, { border: string; chip: string; dot: string }> = {
    AVAILABLE: {
        border: 'border-gold/20 bg-linear-to-br from-white to-ivory',
        chip: 'text-rosewood/60 border-gold/20 bg-white',
        dot: 'bg-gold-accent/40',
    },
    BLOCKED: {
        border: 'border-rosewood/30 bg-linear-to-br from-rosewood/10 to-rosewood/5',
        chip: 'text-rosewood border-rosewood/30 bg-linear-to-br from-rosewood/15 to-rosewood/5',
        dot: 'bg-rosewood/40',
    },
    PARTIALLY_BOOKED: {
        border: 'border-sage/30 bg-linear-to-br from-sage/10 to-sage/5',
        chip: 'text-sage border-sage/30 bg-sage/20',
        dot: 'bg-sage',
    },
    FULLY_BOOKED: {
        border: 'border-sage/50 bg-linear-to-br from-sage/20 to-sage/10',
        chip: 'text-sage border-sage/50 bg-sage/30',
        dot: 'bg-sage/70',
    },
};

const ActionPanelComponent: React.FC<ActionPanelProps> = ({ t, language, selectedDates, entries, onRefresh, onClearSelection, onRemoveDate }) => {
    const isTamil = language === 'ta';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockModalDates, setBlockModalDates] = useState<string[]>([]);

    const dateEntryMap = useMemo(() => {
        const map = new Map<string, CalendarEntry>();
        for (const e of entries) {
            map.set(e.date.split('T')[0], e);
        }
        return map;
    }, [entries]);

    const getDateStatus = (date: Date): CalendarEntryStatus => {
        const dateStr = date.toLocaleDateString('en-CA');
        const entry = dateEntryMap.get(dateStr);
        if (!entry) return 'AVAILABLE';
        if (entry.status === 'BLOCKED') return 'BLOCKED';
        if (entry.status === 'PARTIALLY_BOOKED') return 'PARTIALLY_BOOKED';
        if (entry.status === 'FULLY_BOOKED') return 'FULLY_BOOKED';
        return 'AVAILABLE';
    };

    const availableCount = selectedDates.filter(d => getDateStatus(d) === 'AVAILABLE').length;
    const partiallyBookedCount = selectedDates.filter(d => getDateStatus(d) === 'PARTIALLY_BOOKED').length;
    const fullyBookedCount = selectedDates.filter(d => getDateStatus(d) === 'FULLY_BOOKED').length;
    const blockedCount = selectedDates.filter(d => getDateStatus(d) === 'BLOCKED').length;
    const bookedCount = partiallyBookedCount + fullyBookedCount;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const hasToday = selectedDates.some(d => d.getTime() === todayDate.getTime());

    const blockedEntries = useMemo(() => {
        return selectedDates
            .filter(d => getDateStatus(d) === 'BLOCKED')
            .map(d => {
                const dateStr = d.toLocaleDateString('en-CA');
                const entry = dateEntryMap.get(dateStr) ?? null;
                return { date: d, entry };
            })
            .filter(({ entry }) => entry?.reason);
    }, [selectedDates, dateEntryMap]);

    const singleDate = selectedDates.length === 1 ? selectedDates[0] : null;
    const dateStr = singleDate?.toLocaleDateString('en-CA');
    const showDetail = !!singleDate && (['PARTIALLY_BOOKED', 'FULLY_BOOKED', 'BLOCKED'] as CalendarEntryStatus[]).includes(getDateStatus(singleDate));
    const { data: dayData, isLoading: isLoadingDetail } = useCalendarDay(showDetail ? dateStr : undefined);
    const dayDetail = dayData as CalendarDayOutput | undefined;

    const handleBlock = () => {
        const datesToBlock = selectedDates
            .filter(d => getDateStatus(d) === 'AVAILABLE')
            .map(d => d.toLocaleDateString('en-CA'));
        if (datesToBlock.length === 0) {
            toast.error(isTamil ? 'தடுக்க கிடைக்கும் நாட்கள் இல்லை' : 'No available dates to block');
            return;
        }
        setBlockModalDates(datesToBlock);
        setIsBlockModalOpen(true);
    };

    const unblockDates = useUnblockDates();

    const handleUnblock = async () => {
        const datesToUnblock = selectedDates
            .filter(d => getDateStatus(d) === 'BLOCKED')
            .map(d => d.toLocaleDateString('en-CA'));
        if (datesToUnblock.length === 0) {
            toast.error(isTamil ? 'தடுக்கப்பட்ட நாட்கள் இல்லை' : 'No blocked dates to unblock');
            return;
        }
        await unblockDates.mutateAsync({ dates: datesToUnblock });
        onRefresh();
        onClearSelection?.();
    };

    const buildCalendarEntries = useCallback(async (dateStrs: string[]): Promise<any[]> => {
        const result: any[] = [];
        for (const ds of dateStrs) {
            try {
                const day = await queryClient.fetchQuery({
                    queryKey: queryKeys.mandapam.calendarDay(ds),
                    queryFn: () => getCalendarDayPipeline({ date: ds }),
                });
                if (day?.entries?.length) {
                    for (const e of day.entries) {
                        if (e.status === 'BLOCKED') {
                            result.push({ id: 'blocked', date: ds, startTime: null, endTime: null, status: 'BLOCKED', bookingId: null });
                        }
                    }
                }
                for (const b of (day?.bookings || [])) {
                    if (b.status === 'CANCELLED') continue;
                    result.push({
                        id: b.id,
                        date: ds,
                        startTime: b.bookingConfig?.startTime || null,
                        endTime: b.bookingConfig?.endTime || null,
                        status: b.bookingType === 'HOURLY' ? 'PARTIALLY_BOOKED' : 'FULLY_BOOKED',
                        bookingId: b.id,
                    });
                }
            } catch {}
        }
        return result;
    }, [queryClient]);

    const handleOpenHourlyBooking = async () => {
        if (selectedDates.length === 0) return;
        const dateStr = selectedDates[0].toLocaleDateString('en-CA');
        const existingEntries = await buildCalendarEntries([dateStr]);
        navigate('/admin/mandapam/new-booking', {
            state: {
                bookingType: 'HOURLY' as BookingType,
                dates: [dateStr],
                existingEntries,
            },
        });
    };

    const handleOpenSingleDayBooking = async () => {
        if (selectedDates.length === 0) return;
        const dateStr = selectedDates[0].toLocaleDateString('en-CA');
        const existingEntries = await buildCalendarEntries([dateStr]);
        navigate('/admin/mandapam/new-booking', {
            state: {
                bookingType: 'ONE_DAY' as BookingType,
                dates: [dateStr],
                existingEntries,
            },
        });
    };

    const handleOpenTwoDayBooking = async () => {
        const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        const dateStrs = sorted.map(d => d.toLocaleDateString('en-CA'));
        const existingEntries = await buildCalendarEntries(dateStrs);
        navigate('/admin/mandapam/new-booking', {
            state: {
                bookingType: 'TWO_DAY' as BookingType,
                dates: dateStrs,
                existingEntries,
            },
        });
    };

    if (selectedDates.length === 0) {
        return (
            <div className="bg-linear-to-br from-ivory via-gold-soft/5 to-ivory backdrop-blur-sm border-2 border-gold/20 rounded-2xl p-4 md:p-8">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rosewood/5 flex items-center justify-center mb-4 border border-gold/10">
                        <CalendarIcon size={24} className="text-rosewood/30" />
                    </div>
                    <p className="text-sm font-black text-rosewood/40">
                        {isTamil ? 'தேதியைத் தேர்ந்தெடுக்கவும்' : 'Select a date'}
                    </p>
                    <p className="text-[10px] text-rosewood/30 mt-1">
                        {isTamil ? 'செயல்களைக் காண தேதியைத் தேர்வுசெய்க' : 'Choose a date to view available actions'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-linear-to-br from-ivory via-gold-soft/5 to-ivory backdrop-blur-sm border-2 border-gold/20 rounded-2xl p-4 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-rosewood/15 to-rosewood/5 flex items-center justify-center">
                            <CalendarIcon size={18} className="text-rosewood" />
                        </div>
                        <h3 className="font-heading text-lg font-black text-rosewood">
                            {isTamil ? `${selectedDates.length} நாட்கள் தேர்ந்தெடுக்கப்பட்டன` : `${selectedDates.length} dates selected`}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {availableCount > 0 && (
                            <span className="text-[10px] font-black text-rosewood/60 bg-white/80 px-2.5 py-1.5 rounded-lg border border-gold/20 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold-accent/40" />
                                {isTamil ? `${availableCount} கிடைக்கும்` : `${availableCount} Available`}
                            </span>
                        )}
                        {blockedCount > 0 && (
                            <span className="text-[10px] font-black text-rosewood bg-rosewood/10 px-2.5 py-1.5 rounded-lg border border-rosewood/20 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rosewood/40" />
                                {isTamil ? `${blockedCount} தடுக்கப்பட்டது` : `${blockedCount} Blocked`}
                            </span>
                        )}
                        {bookedCount > 0 && (
                            <span className="text-[10px] font-black text-sage bg-sage/20 px-2.5 py-1.5 rounded-lg border border-sage/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                                {isTamil ? `${bookedCount} முன்பதிவு` : `${bookedCount} Booked`}
                            </span>
                        )}
                        {onClearSelection && (
                            <button onClick={onClearSelection} className="px-3 py-1.5 rounded-xl text-[10px] font-black text-ivory bg-linear-to-br from-rosewood to-dark-rosewood hover:from-dark-rosewood hover:to-rosewood transition-all active:scale-95 ml-1">
                                {isTamil ? 'தேர்வை அழி' : 'Clear selection'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-3 mb-6">
                    {[...selectedDates].sort((a, b) => a.getTime() - b.getTime()).map((date, i) => {
                        const status = getDateStatus(date);
                        const tInfo = getTamilDateInfo(date);
                        const parts = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).formatToParts(date);
                        const day = parts.find(p => p.type === 'day')?.value;
                        const month = parts.find(p => p.type === 'month')?.value;
                        const year = parts.find(p => p.type === 'year')?.value;
                        const weekday = parts.find(p => p.type === 'weekday')?.value;
                        const s = STATUS_STYLES[status];

                        return (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${s.border}`}>
                                <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shrink-0 border border-gold/10">
                                    <span className="text-lg font-heading font-black text-rosewood leading-none">{day}</span>
                                    <span className="text-[7px] font-black uppercase text-rosewood/40 tracking-widest mt-0.5">{month?.substring(0, 3)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-rosewood">{weekday}, {month} {day}, {year}</p>
                                    <p className="text-xs text-rosewood/50 mt-0.5">
                                        <span className="font-semibold">{tInfo.nameTa}</span>
                                        <span className="mx-1.5 opacity-40">·</span>
                                        <span>{tInfo.tDate}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${s.chip}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                        {status === 'AVAILABLE' ? (isTamil ? 'கிடைக்கும்' : 'Available')
                                            : status === 'BLOCKED' ? (isTamil ? 'தடுக்கப்பட்டது' : 'Blocked')
                                            : status === 'FULLY_BOOKED' ? (isTamil ? 'முழு முன்பதிவு' : 'Fully Booked')
                                            : (isTamil ? 'பகுதி முன்பதிவு' : 'Partially Booked')}
                                    </span>
                                    {onRemoveDate && (
                                        <button
                                            onClick={() => onRemoveDate(date)}
                                            className="w-6 h-6 rounded-full flex items-center justify-center bg-rosewood text-white transition-all hover:rotate-90 active:scale-90"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>



                {isLoadingDetail && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-rosewood/40" />
                    </div>
                )}
                {!isLoadingDetail && dayDetail && dayDetail.entries?.[0]?.status === 'BLOCKED' && (
                    <div className="bg-linear-to-br from-rosewood/[0.02] via-ivory to-rosewood/[0.02] border border-rosewood/20 rounded-2xl p-4 md:p-6 space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-rosewood/10 flex items-center justify-center">
                                <Info size={12} className="text-rosewood/60" />
                            </div>
                            <span className="text-[9px] font-black text-rosewood/50 uppercase tracking-[0.15em]">
                                {isTamil ? 'தேதி தடுக்கப்பட்டுள்ளது' : 'Date Blocked'}
                            </span>
                        </div>
                        {dayDetail.entries[0].reason && (
                            <p className="text-sm text-rosewood/70 font-bold">
                                {isTamil ? dayDetail.entries[0].reason!.ta : dayDetail.entries[0].reason!.en}
                            </p>
                        )}
                    </div>
                )}
                {!isLoadingDetail && dayDetail && dayDetail.bookings?.length > 0 && (
                    <div className="space-y-0">
                    {(dayDetail.bookings as any[]).map((b, bIdx) => {
                    const totalCharges = b.totalCharges || 0;
                    const totalPayments = b.totalPayments || 0;
                    const totalRefunds = b.totalRefunds || 0;
                    const balance = b.outstandingAmount ?? (totalCharges - totalPayments + totalRefunds);
                    const custName = b.customerName;
                    const evtTitle = b.eventTitle;
                    const config = b.bookingConfig || {};
                    const startT = config.startTime ? fmt12(config.startTime) : null;
                    const endT = config.endTime ? fmt12(config.endTime) : null;
                    const discountTotal = (b.ledgerEntries || [])
                        .filter((e: any) => e.source === 'DISCOUNT')
                        .reduce((s: number, e: any) => s + Math.abs(Number(e.amount)), 0);
                    const chargeEntries = (b.ledgerEntries || []).filter((e: any) => !['DISCOUNT', 'PACKAGE'].includes(e.source));
                    const packageEntries = (b.ledgerEntries || []).filter((e: any) => e.source === 'PACKAGE');

                    const getLedgerLabel = (entry: any): string => {
                        const desc = entry.description
                            ? (isTamil ? entry.description.ta || entry.description.en : entry.description.en || entry.description.ta)
                            : '';
                        switch (entry.source) {
                            case 'PACKAGE': return isTamil ? 'தொகுப்பு கட்டணம்' : 'Package Fee';
                            case 'ADDON': {
                            let label = desc || (isTamil ? 'சேர்க்கை' : 'Add-on');
                            label = label.replace(/^(Addon:\s*|கூடுதல்:\s*)/i, '');
                            label = label.replace(/\s*₹[\d,]+(\s*×\s*\d+[\dhNd]*)?.*$/g, '').trim();
                            return label || (isTamil ? 'சேர்க்கை' : 'Add-on');
                        }
                            case 'DAMAGE': return `${isTamil ? 'சேதம்' : 'Damage'}${desc ? `: ${desc}` : ''}`;
                            case 'PENALTY': return `${isTamil ? 'அபராதம்' : 'Penalty'}${desc ? `: ${desc}` : ''}`;
                            case 'SERVICE': return `${isTamil ? 'கூடுதல்' : 'Extra'}${desc ? `: ${desc}` : ''}`;
                            case 'DISCOUNT': return isTamil ? 'தள்ளுபடி' : 'Discount';
                            case 'ADJUSTMENT': return desc || (isTamil ? 'சரிசெய்தல்' : 'Adjustment');
                            default: return desc || entry.source;
                        }
                    };

                    const statusStyle = getBookingStatusStyle(b.status);
                    const statusLabel = b.status === 'CONFIRMED' ? (isTamil ? 'உறுதிப்படுத்தப்பட்டது' : 'Confirmed')
                        : b.status === 'IN_PROGRESS' ? (isTamil ? 'நிகழ்வு நடைபெறுகிறது' : 'Event In Progress')
                        : b.status === 'SETTLEMENT_PENDING' ? (isTamil ? 'தீர்வு நிலுவை' : 'Settlement Pending')
                        : b.status === 'COMPLETED' ? (isTamil ? 'முடிக்கப்பட்டது' : 'Completed')
                        : b.status === 'CANCELLED' ? (isTamil ? 'ரத்து செய்யப்பட்டது' : 'Cancelled')
                        : b.status;

                    const bTypeLabel = b.bookingType === 'HOURLY' ? (isTamil ? 'மணிநேர முன்பதிவு' : 'Hourly Booking')
                        : b.bookingType === 'ONE_DAY' ? (isTamil ? 'ஒரு நாள் முன்பதிவு' : '1 Day Booking')
                        : (isTamil ? 'இரண்டு நாள் முன்பதிவு' : '2 Day Booking');

                    return (
                        <React.Fragment key={b.id}>
                        {bIdx > 0 && <SectionDivider />}
                        <SectionCard3D>
                            <SectionHeaderRedesigned
                                title={b.bookingNo}
                                icon={<Receipt size={16} />}
                                gradient="bg-ivory-gold-gradient text-rosewood"
                                isTamil={isTamil}
                            >
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.text.replace('text-', 'bg-').replace('-700', '-500')}`} />
                                    {statusLabel}
                                </span>
                                <button onClick={() => navigate(`/admin/mandapam/bookings/${b.id}`)} className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-rosewood bg-ivory-gold-gradient hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shrink-0">
                                    <Eye size={12} />
                                    {isTamil ? 'விவரம்' : 'View'}
                                </button>
                            </SectionHeaderRedesigned>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                <div>
                                    <DetailRow label={isTamil ? 'பெயர்' : 'Name'} value={isTamil ? custName?.ta || custName?.en : custName?.en || custName?.ta} />
                                    <DetailRow label={isTamil ? 'தொலைபேசி' : 'Phone'} value={b.customerPhone} />
                                    <DetailRow label={isTamil ? 'நிகழ்வுத் தலைப்பு' : 'Event Title'} value={isTamil ? evtTitle?.ta || evtTitle?.en : evtTitle?.en || evtTitle?.ta} />
                                    <DetailRow label={isTamil ? 'நிகழ்வு வகை' : 'Event Type'} value={b.eventType} />
                                </div>
                                <div>
                                    <DetailRow label={isTamil ? 'முன்பதிவு வகை' : 'Booking Type'} value={bTypeLabel} />
                                    <DetailRow label={isTamil ? 'தேதி' : 'Date'} value={
                                        `${new Date(config.startDate || dateStr!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${config.endDate && config.endDate !== config.startDate ? ` — ${new Date(config.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
                                    } />
                                    {b.bookingType === 'HOURLY' && startT && endT && (
                                        <DetailRow label={isTamil ? 'நேரம்' : 'Time'} value={`${startT} — ${endT}${config.durationHours ? ` (${config.durationHours}h)` : ''}`} />
                                    )}
                                    <DetailRow label={isTamil ? 'தொகுப்பு' : 'Package'} value={b.packageSnapshot?.packageName?.en || b.packageCode} />
                                </div>
                            </div>

                            <div className="border-t border-gold/10 mt-3 pt-3">
                                <div className="overflow-hidden rounded-xl border border-gold/10">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-rosewood/[0.03]">
                                                <th className="text-left py-2 px-3 font-semibold text-rosewood">{isTamil ? 'விளக்கம்' : 'Description'}</th>
                                                <th className="text-right py-2 px-3 font-semibold text-rosewood">{isTamil ? 'தொகை' : 'Amount'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(packageEntries.length > 0 || chargeEntries.length > 0) ? (
                                                <>
                                                    {packageEntries.map((e: any, i: number) => (
                                                        <tr key={e.id || `pkg-${i}`} className="border-t border-gold/5">
                                                            <td className="py-2 px-3 font-semibold text-dark-brown">{getLedgerLabel(e)}</td>
                                                            <td className="py-2 px-3 font-semibold text-dark-brown text-right">{formatCurrency(Number(e.amount))}</td>
                                                        </tr>
                                                    ))}
                                                    {chargeEntries.map((e: any, i: number) => (
                                                        <tr key={e.id || `chg-${i}`} className="border-t border-gold/5">
                                                            <td className="py-2 px-3 font-semibold text-dark-brown">{getLedgerLabel(e)}</td>
                                                            <td className="py-2 px-3 font-semibold text-dark-brown text-right">{formatCurrency(Number(e.amount))}</td>
                                                        </tr>
                                                    ))}
                                                </>
                                            ) : (
                                                <tr>
                                                    <td colSpan={2} className="py-3 px-3 text-center text-dark-brown/50">
                                                        {isTamil ? 'கட்டண உள்ளீடுகள் இல்லை' : 'No charge entries'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-gold/20">
                                                <td className="py-2 px-3 font-bold text-rosewood">{isTamil ? 'மொத்த கட்டணம்' : 'Total Charges'}</td>
                                                <td className="py-2 px-3 font-bold text-rosewood text-right">{formatCurrency(totalCharges + discountTotal)}</td>
                                            </tr>
                                            {discountTotal > 0 && (
                                                <tr className="border-t border-gold/5">
                                                    <td className="py-2 px-3 font-semibold text-dark-brown/70">{isTamil ? 'தள்ளுபடி' : 'Discount'}</td>
                                                    <td className="py-2 px-3 font-semibold text-rose-600 text-right">({formatCurrency(discountTotal)})</td>
                                                </tr>
                                            )}
                                            <tr className="border-t border-gold/5">
                                                <td className="py-2 px-3 font-semibold text-dark-brown">{isTamil ? 'செலுத்தப்பட்டது' : 'Paid'}</td>
                                                <td className="py-2 px-3 font-semibold text-emerald-700 text-right">{formatCurrency(totalPayments)}</td>
                                            </tr>
                                            <tr className="border-t border-gold/5">
                                                <td className="py-2 px-3 font-bold text-rosewood">{isTamil ? 'இருப்பு' : 'Balance Due'}</td>
                                                <td className={`py-2 px-3 font-bold text-right ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{formatCurrency(balance)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </SectionCard3D>
                        </React.Fragment>
                    );
                })}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-gold/10">
                    <p className="text-[10px] text-rosewood/40 italic flex items-center gap-1 mr-auto">
                        <Info size={12} />
                        {t('adminMandapam.calendar.blockingWarning') || 'Actions apply to matching dates only.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedDates.length === 1 && (availableCount === 1 || partiallyBookedCount === 1) && (
                            <>
                                <button
                                    onClick={handleOpenHourlyBooking}
                                    className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-ivory-gold-gradient hover:-translate-y-0.5 active:scale-[0.98]"
                                >
                                    <Clock size={14} />
                                    {isTamil ? 'நேர அடிப்படை முன்பதிவு' : 'Hourly Booking'}
                                </button>
                                {availableCount === 1 && !hasToday && (
                                    <button
                                        onClick={handleOpenSingleDayBooking}
                                        className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-ivory-gold-gradient hover:ring-2 hover:ring-gold/30 active:scale-[0.98]"
                                    >
                                        <CalendarIcon size={14} />
                                        {isTamil ? 'முழு நாள் முன்பதிவு' : 'Full Day Booking'}
                                    </button>
                                )}
                            </>
                        )}
                        {selectedDates.length === 2 && availableCount === 2 && !hasToday && (
                            <button
                                onClick={handleOpenTwoDayBooking}
                                className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-ivory-gold-gradient hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <PlusCircle size={14} />
                                {t('adminMandapam.bookings.addMultiDayBooking') || '2-Day Full Day Booking'}
                            </button>
                        )}
                        {availableCount > 0 && (
                            <button
                                onClick={handleBlock}
                                className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-rosewood to-dark-rosewood text-ivory hover:from-dark-rosewood hover:to-rosewood active:scale-[0.98]"
                            >
                                <CheckCircle size={14} />
                                {isTamil ? `${availableCount} நாட்களை தடு` : `Block ${availableCount} date(s)`}
                            </button>
                        )}
                        {blockedCount > 0 && (
                            <button
                                onClick={handleUnblock}
                                disabled={unblockDates.isPending}
                                className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-gold-soft/30 to-gold-soft/10 text-rosewood border-2 border-gold-accent hover:from-gold-soft/40 hover:to-gold-soft/20 disabled:opacity-40 active:scale-[0.98]"
                            >
                                {unblockDates.isPending ? <div className="w-4 h-4 border-2 border-rosewood border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                {isTamil ? `${blockedCount} நாட்களை திற` : `Unblock ${blockedCount} date(s)`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {blockedEntries.length > 0 && (
                <div className="bg-linear-to-br from-rosewood/[0.02] via-ivory to-rosewood/[0.02] border border-rosewood/20 rounded-2xl p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rosewood/10 flex items-center justify-center">
                            <Info size={12} className="text-rosewood/60" />
                        </div>
                        <span className="text-[9px] font-black text-rosewood/50 uppercase tracking-[0.15em]">
                            {isTamil ? 'தடுக்கப்பட்ட நாட்கள் — காரணம்' : 'Blocked Dates — Reason'}
                        </span>
                    </div>
                    {blockedEntries.map(({ date, entry }) => {
                        const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).formatToParts(date);
                        const day = parts.find(p => p.type === 'day')?.value;
                        const month = parts.find(p => p.type === 'month')?.value;
                        const year = parts.find(p => p.type === 'year')?.value;
                        const weekday = parts.find(p => p.type === 'weekday')?.value;
                        const reason = entry?.reason as { en: string; ta: string } | undefined;
                        return (
                            <div key={date.toISOString()} className="flex items-start gap-3 p-3 rounded-xl bg-white/40 border border-rosewood/10">
                                <div className="w-10 h-10 rounded-lg bg-rosewood/5 flex flex-col items-center justify-center shrink-0 border border-rosewood/20">
                                    <span className="text-sm font-heading font-black text-rosewood leading-none">{day}</span>
                                    <span className="text-[6px] font-black uppercase text-rosewood/40 tracking-widest mt-0.5">{month?.substring(0, 3)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-rosewood">{weekday}, {month} {day}, {year}</p>
                                    {reason && (
                                        <p className="text-[11px] text-rosewood/60 mt-1 leading-relaxed">
                                            {isTamil ? reason.ta : reason.en}
                                            <span className="mx-1.5 text-rosewood/20">·</span>
                                            <span className="text-rosewood/40">{isTamil ? reason.en : reason.ta}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <BlockDatesModal
                isOpen={isBlockModalOpen}
                onClose={() => setIsBlockModalOpen(false)}
                t={t}
                dates={blockModalDates}
                onSuccess={() => { onRefresh(); onClearSelection?.(); }}
            />
        </>
    );
};

export const ActionPanel = React.memo(ActionPanelComponent);
