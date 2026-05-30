import React, { useState } from 'react';
import { adminUnblockDates } from '@/api/mandapam.api';
import {
    Calendar as CalendarIcon,
    Info,
    CheckCircle,
    Trash2,
    Clock,
    PlusCircle,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { NewBookingModal } from '@/modals/admin/NewBookingModal';
import { BlockDatesModal } from '@/modals/admin/BlockDatesModal';
import { getTamilDateInfo } from '@/constants/calendar';

interface ActionPanelProps {
    t: any;
    language: string;
    selectedDates: Date[];
    entries: any[];
    onRefresh: () => void;
    onClearSelection?: () => void;
    onRemoveDate?: (date: Date) => void;
}

const STATUS_STYLES: Record<string, { border: string; chip: string; dot: string }> = {
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
    BOOKED: {
        border: 'border-sage/30 bg-linear-to-br from-sage/10 to-sage/5',
        chip: 'text-sage border-sage/30 bg-sage/20',
        dot: 'bg-sage',
    },
};

export const ActionPanel: React.FC<ActionPanelProps> = ({ t, language, selectedDates, entries, onRefresh, onClearSelection, onRemoveDate }) => {
    const isTamil = language === 'ta';
    const [isUnblocking, setIsUnblocking] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingModalDates, setBookingModalDates] = useState<string[]>([]);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockModalDates, setBlockModalDates] = useState<string[]>([]);

    const getDateStatus = (date: Date): 'AVAILABLE' | 'BOOKED' | 'BLOCKED' => {
        const dateStr = date.toLocaleDateString('en-CA');
        const entry = entries.find((e: any) => e.date.split('T')[0] === dateStr);
        if (!entry) return 'AVAILABLE';
        if (entry.status === 'BLOCKED') return 'BLOCKED';
        if (entry.status === 'FULLY_BOOKED' || entry.status === 'PARTIALLY_BOOKED') return 'BOOKED';
        return 'AVAILABLE';
    };

    const availableCount = selectedDates.filter(d => getDateStatus(d) === 'AVAILABLE').length;
    const blockedCount = selectedDates.filter(d => getDateStatus(d) === 'BLOCKED').length;
    const bookedCount = selectedDates.filter(d => getDateStatus(d) === 'BOOKED').length;

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

    const handleUnblock = async () => {
        const datesToUnblock = selectedDates
            .filter(d => getDateStatus(d) === 'BLOCKED')
            .map(d => d.toLocaleDateString('en-CA'));
        if (datesToUnblock.length === 0) {
            toast.error(isTamil ? 'தடுக்கப்பட்ட நாட்கள் இல்லை' : 'No blocked dates to unblock');
            return;
        }
        setIsUnblocking(true);
        try {
            await adminUnblockDates({ dates: datesToUnblock });
            toast.success(isTamil ? `${datesToUnblock.length} நாட்கள் திறக்கப்பட்டன` : `${datesToUnblock.length} date(s) unblocked successfully`);
            onRefresh();
            onClearSelection?.();
        } catch (err: any) {
            toast.error(err.message || 'Failed to unblock dates');
        } finally {
            setIsUnblocking(false);
        }
    };

    const handleOpenBookingFromSingle = () => {
        if (selectedDates.length === 0) return;
        setBookingModalDates([selectedDates[0].toLocaleDateString('en-CA')]);
        setIsBookingModalOpen(true);
    };

    const handleOpenBookingFromMulti = () => {
        const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        setBookingModalDates(sorted.map(d => d.toLocaleDateString('en-CA')));
        setIsBookingModalOpen(true);
    };

    if (selectedDates.length === 0) {
        return (
            <>
                <div className="bg-linear-to-br from-ivory via-gold-soft/5 to-ivory backdrop-blur-xl border-2 border-dashed border-gold/30 rounded-2xl p-8 md:p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-rosewood/10 flex items-center justify-center mb-5">
                        <CalendarIcon size={28} className="text-rosewood/40" />
                    </div>
                    <p className="text-rosewood/50 font-black text-sm uppercase tracking-[0.2em] max-w-xs">
                        {t('adminMandapam.calendar.selectDateToManage') || 'Select a date to manage availability'}
                    </p>
                </div>
                <NewBookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    t={t}
                    initialDates={bookingModalDates}
                    onSuccess={() => { onRefresh(); onClearSelection?.(); }}
                />
                <BlockDatesModal
                    isOpen={isBlockModalOpen}
                    onClose={() => setIsBlockModalOpen(false)}
                    t={t}
                    dates={blockModalDates}
                    onSuccess={() => { onRefresh(); onClearSelection?.(); }}
                />
            </>
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
                    {onClearSelection && (
                        <button onClick={onClearSelection} className="px-4 py-2 rounded-xl text-xs font-black text-ivory bg-linear-to-br from-rosewood to-dark-rosewood hover:from-dark-rosewood hover:to-rosewood transition-all active:scale-95">
                            {isTamil ? 'தேர்வை அழி' : 'Clear selection'}
                        </button>
                    )}
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
                                            : (isTamil ? 'முன்பதிவு' : 'Booked')}
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

                <div className="flex flex-wrap items-center gap-2 mb-6">
                    {availableCount > 0 && (
                        <span className="text-[11px] font-black text-rosewood/60 bg-white/80 px-3 py-1.5 rounded-lg border border-gold/20 flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-gold-accent/40" />
                            {isTamil ? `${availableCount} கிடைக்கும்` : `${availableCount} Available`}
                        </span>
                    )}
                    {blockedCount > 0 && (
                        <span className="text-[11px] font-black text-rosewood bg-rosewood/10 px-3 py-1.5 rounded-lg border border-rosewood/20 flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-rosewood/40" />
                            {isTamil ? `${blockedCount} தடுக்கப்பட்டது` : `${blockedCount} Blocked`}
                        </span>
                    )}
                    {bookedCount > 0 && (
                        <span className="text-[11px] font-black text-sage bg-sage/20 px-3 py-1.5 rounded-lg border border-sage/30 flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-sage" />
                            {isTamil ? `${bookedCount} முன்பதிவு` : `${bookedCount} Booked`}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-gold/10">
                    <p className="text-[10px] text-rosewood/40 italic flex items-center gap-1 mr-auto">
                        <Info size={12} />
                        {t('adminMandapam.calendar.blockingWarning') || 'Actions apply to matching dates only.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {availableCount === 1 && selectedDates.length === 1 && (
                            <>
                                <button
                                    onClick={handleOpenBookingFromSingle}
                                    className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-rosewood to-dark-rosewood text-ivory active:scale-[0.98]"
                                >
                                    <Clock size={14} />
                                    {isTamil ? 'நேர அடிப்படை முன்பதிவு' : 'Hourly Booking'}
                                </button>
                                <button
                                    onClick={handleOpenBookingFromSingle}
                                    className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-rosewood to-dark-rosewood text-ivory active:scale-[0.98]"
                                >
                                    <CalendarIcon size={14} />
                                    {isTamil ? 'முழு நாள் முன்பதிவு' : 'Full Day Booking'}
                                </button>
                            </>
                        )}
                        {selectedDates.length === 2 && availableCount === 2 && (
                            <button
                                onClick={handleOpenBookingFromMulti}
                                className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-gold-accent to-gold text-rosewood active:scale-[0.98]"
                            >
                                <PlusCircle size={14} />
                                {t('adminMandapam.bookings.addMultiDayBooking') || '2-Day Full Day Booking'}
                            </button>
                        )}
                        {availableCount > 0 && (
                            <button
                                onClick={handleBlock}
                                className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-rosewood to-dark-rosewood text-ivory active:scale-[0.98]"
                            >
                                <CheckCircle size={14} />
                                {isTamil ? `${availableCount} நாட்களை தடு` : `Block ${availableCount} date(s)`}
                            </button>
                        )}
                        {blockedCount > 0 && (
                            <button
                                onClick={handleUnblock}
                                disabled={isUnblocking}
                                className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-gold-soft/30 to-gold-soft/10 text-rosewood border-2 border-gold-accent hover:from-gold-soft/40 hover:to-gold-soft/20 disabled:opacity-40 active:scale-[0.98]"
                            >
                                {isUnblocking ? <div className="w-4 h-4 border-2 border-rosewood border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                {isTamil ? `${blockedCount} நாட்களை திற` : `Unblock ${blockedCount} date(s)`}
                            </button>
                        )}
                        {bookedCount > 0 && selectedDates.length === 1 && (
                            <button
                                onClick={handleOpenBookingFromSingle}
                                className="px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-linear-to-br from-rosewood to-dark-rosewood text-ivory active:scale-[0.98]"
                            >
                                <PlusCircle size={14} />
                                {t('adminMandapam.bookings.addNewBooking') || 'Create Booking'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <NewBookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                t={t}
                initialDates={bookingModalDates}
                onSuccess={() => { onRefresh(); onClearSelection?.(); }}
            />
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
