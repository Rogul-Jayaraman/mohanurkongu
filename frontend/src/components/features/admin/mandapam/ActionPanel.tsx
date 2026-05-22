import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
    Calendar as CalendarIcon, 
    Info, 
    CheckCircle, 
    Trash2, 
    Clock, 
    AlertCircle, 
    Hash,
    CalendarCheck, 
    PlusCircle 
} from 'lucide-react';

const TAMIL_MONTHS = [
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
    if (currentTamilMonthIndex === -1) return { nameTa: "", tDate: "" };
    return { nameTa: TAMIL_MONTHS[currentTamilMonthIndex].nameTa, tDate: daysSinceTamilMonthStart };
};
import TranslatableTextarea from '@/components/ui/forms/TranslatableTextarea';
import { 
    useBlockDateMutation, 
    useUnblockDateMutation, 
    useAdminCalendarQuery,
    useAdminBookingByDateQuery,
    useAdminBlockedDetailsQuery
} from '@/hooks/queries/useAdminMandapam';
import { toast } from 'sonner';
import { NewBookingModal } from '@/modals/admin/NewBookingModal';

interface ActionPanelProps {
    t: any;
    language: string;
    selectedDate: Date | null;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ t, language, selectedDate }) => {
    const isTamil = language === 'ta';
    const [reasonEn, setReasonEn] = useState('');
    const [reasonTa, setReasonTa] = useState('');

    const { data: calendarData = [] } = useAdminCalendarQuery();
    const queryClient = useQueryClient();
    const blockMutation = useBlockDateMutation();
    const unblockMutation = useUnblockDateMutation();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    
    // Normalize selected date to string for reliable comparison and queries
    const selectedDateStr = selectedDate ? selectedDate.toLocaleDateString('en-CA') : null;
    
    // Find the status of the selected date from calendar data
    const dateStatus = calendarData.find((item: any) => item.date === selectedDateStr)?.type || 'AVAILABLE';

    // Conditionally enable queries based on the date status
    const { data: bookingDetails = [], isLoading: isLoadingBookings } = useAdminBookingByDateQuery(
        dateStatus === 'BOOKED' ? selectedDateStr : null
    );
    const { data: blockedDetails, isLoading: isLoadingBlocked } = useAdminBlockedDetailsQuery(
        dateStatus === 'BLOCKED' ? selectedDateStr : null
    );

    const isDateAvailable = dateStatus === 'AVAILABLE';
    const isDateBooked = dateStatus === 'BOOKED';
    const isDateBlocked = dateStatus === 'BLOCKED';

    const getPaymentStatusInfo = (status: string) => {
        switch (status) {
            case 'FULLY_PAID':
                return { 
                    label: t('adminMandapam.bookings.fullyPaid') || 'Fully Paid', 
                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: <CheckCircle size={12} />
                };
            case 'ADVANCE':
                return { 
                    label: t('adminMandapam.bookings.advance') || 'Advance Paid', 
                    color: 'bg-amber-100 text-amber-700 border-amber-200',
                    icon: <Clock size={12} />
                };
            case 'NOT_PAID':
                return { 
                    label: t('adminMandapam.bookings.notPaid') || 'Not Paid', 
                    color: 'bg-rose-100 text-rose-700 border-rose-200',
                    icon: <AlertCircle size={12} />
                };
            default:
                return { 
                    label: status, 
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: <Hash size={12} />
                };
        }
    };

    const getSessionLabel = (session: string) => {
        switch(session) {
            case 'MORNING': return t('adminMandapam.bookings.morning') || 'Morning';
            case 'EVENING': return t('adminMandapam.bookings.evening') || 'Evening';
            case 'FULL_DAY': return t('adminMandapam.bookings.fullDay') || 'Full Day';
            default: return session;
        }
    };

    useEffect(() => {
        if (selectedDate) {
            setReasonEn('');
            setReasonTa('');
        }
    }, [selectedDate]);

    const tamilInfo = selectedDate ? getTamilDateInfo(selectedDate) : { nameTa: "", tDate: "" };

    if (!selectedDate) {
        return (
            <div className="mt-6 md:mt-8 p-6 md:p-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-2xl border-2 border-gold/30 flex flex-col items-center justify-center text-center relative">
                <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <CalendarIcon size={32} className="text-rosewood/30 mb-4" />
                    <p className="text-rosewood/60 font-bold uppercase tracking-widest text-xs">
                        {t('adminMandapam.calendar.selectDateToManage') || 'Select a date to manage availability'}
                    </p>
                </div>
            </div>
        );
    }

    const localizedDate = new Intl.DateTimeFormat(
        language === 'ta' ? 'ta-IN' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }
    ).formatToParts(selectedDate);

    const displayDay = localizedDate.find(p => p.type === 'day')?.value;
    const displayMonth = localizedDate.find(p => p.type === 'month')?.value;
    const displayYear = localizedDate.find(p => p.type === 'year')?.value;
    const displayDayOfWeek = localizedDate.find(p => p.type === 'weekday')?.value;

    const handleBlock = () => {
        if (!selectedDate) return;
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        blockMutation.mutate({
            date: dateStr,
            reasonEn: reasonEn || 'Administrative Reasons',
            reasonTa: reasonTa || 'நிர்வாக காரணங்கள்'
        }, {
            onSuccess: () => {
                toast.success(t('adminMandapam.calendar.blockSuccess') || 'Date blocked successfully');
                setReasonEn('');
                setReasonTa('');
            },
            onError: (err: any) => toast.error(err.message || 'Failed to block date')
        });
    };

    const handleUnblock = () => {
        if (!selectedDate) return;
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        unblockMutation.mutate(dateStr, {
            onSuccess: () => toast.success(t('adminMandapam.calendar.unblockSuccess') || 'Date unblocked successfully'),
            onError: (err: any) => toast.error(err.message || 'Failed to unblock date')
        });
    };

    return (
        <div className="rounded-xl overflow-hidden bg-white/10 backdrop-blur-2xl border-2 border-gold/30 relative">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10">
                <div className="px-6 py-3 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
                    <h5 className="text-[11px] font-bold uppercase tracking-[0.2em] text-rosewood">
                        {t('adminMandapam.calendar.actionPanel') || 'Action Panel'}
                    </h5>
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest mb-2 ml-1">
                            {t('adminMandapam.calendar.selectedDate') || 'Selected Date'}
                        </p>
                        <div className="flex items-center gap-4 bg-linear-to-br from-ivory via-ivory to-gold-soft/30 p-4 rounded-xl border border-gold/20 shadow-sm w-full">
                            <div className="w-12 h-12 rounded-full bg-linear-to-br from-gold/30 via-ivory to-gold/30 flex items-center justify-center shrink-0">
                                <CalendarIcon size={24} className="text-rosewood" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xl font-serif text-rosewood font-bold">{displayDay} {displayMonth}</p>
                                    <p className="text-[10px] text-rosewood/60 font-semibold">{displayDayOfWeek}, {displayYear}</p>
                                </div>
                                <div className="w-px h-8 bg-gold/20" />
                                <div>
                                    <p className="text-xl font-serif text-rosewood font-bold">{tamilInfo.tDate} {tamilInfo.nameTa}</p>
                                    <p className="text-[10px] text-rosewood/60 font-semibold">{isTamil ? 'தமிழ் நாள்' : 'Tamil Date'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5">
                            {/* Bookings Details */}
                            {isDateBooked && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-gold rounded-full" />
                                        <p className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest">{t('adminMandapam.calendar.bookingsForToday') || 'Bookings for this Day'}</p>
                                    </div>
                                    {isLoadingBookings ? (
                                        <div className="flex justify-center p-8 bg-white/10 backdrop-blur-xl rounded-xl border border-gold/20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest">Fetching Booking Info...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {bookingDetails.length > 0 ? (
                                                bookingDetails.map((booking: any) => {
                                                    const statusInfo = getPaymentStatusInfo(booking.paymentStatus);
                                                    return (
                                                        <div key={booking.eventId} className="p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-gold/20 hover:border-gold/30 transition-all duration-300">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex items-start gap-3 min-w-0">
                                                                    <div className="p-2 bg-linear-to-br from-gold/30 via-ivory to-gold/30 rounded-xl shrink-0">
                                                                        <Hash size={16} className="text-rosewood" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rosewood/5 text-rosewood/60 rounded uppercase">#{booking.eventId}</span>
                                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.color}`}>
                                                                                {statusInfo.icon} {statusInfo.label}
                                                                            </span>
                                                                        </div>
                                                                        <h6 className="font-serif font-bold text-rosewood text-base truncate">{language === 'ta' ? booking.eventTitleTa : booking.eventTitleEn}</h6>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-linear-to-br from-rosewood/10 to-rosewood/5 px-3 py-1.5 rounded-lg text-right shrink-0 ml-2">
                                                                    <p className="text-[10px] text-rosewood/40 uppercase font-bold tracking-tight mb-0.5">Session</p>
                                                                    <p className="text-rosewood font-black text-xs leading-none">{getSessionLabel(booking.session)}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-3 border-t border-gold/10">
                                                                <div>
                                                                    <p className="text-[9px] text-rosewood/40 font-black uppercase tracking-widest mb-0.5">Client</p>
                                                                    <p className="text-rosewood font-bold text-sm tracking-tight">{language === 'ta' ? booking.contactNameTa : booking.contactNameEn}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] text-rosewood/40 font-black uppercase tracking-widest mb-0.5">Phone</p>
                                                                    <p className="text-rosewood font-bold text-sm tracking-tight">{booking.phone}</p>
                                                                </div>
                                                                <div className="ml-auto text-right">
                                                                    <p className="text-[9px] text-rosewood/40 font-black uppercase tracking-widest mb-0.5">Settlement</p>
                                                                    <p className="text-rosewood font-black text-sm">₹{booking.paidAmount?.toLocaleString()} <span className="text-rosewood/40 font-normal text-[10px]">/ ₹{booking.totalAmount?.toLocaleString()}</span></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-8 bg-white/10 backdrop-blur-xl rounded-xl border border-gold/20 text-center">
                                                    <p className="text-rosewood/40 text-sm italic">Status mismatch: No booking data found.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Blocked Details */}
                            {isDateBlocked && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-gold rounded-full" />
                                        <p className="text-[9px] text-rosewood/50 font-black uppercase tracking-widest">{t('adminMandapam.calendar.dateIsBlocked') || 'Date is Blocked'}</p>
                                    </div>
                                    {isLoadingBlocked ? (
                                        <div className="flex justify-center p-8 bg-amber-50/20 rounded-xl border border-amber-100 border-dashed">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Loading Block Details...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-5 bg-linear-to-br from-amber-50/30 to-amber-50/10 rounded-xl border border-amber-200/30 flex items-start gap-4">
                                            <div className="p-2.5 bg-amber-100/50 rounded-xl text-amber-600 shrink-0">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{t('adminMandapam.calendar.currentlyBlocked') || 'Administrative Hold'}</span>
                                                </div>
                                                <p className="text-amber-800/70 italic text-sm leading-relaxed">
                                                    "{language === 'ta' ? (blockedDetails?.reasonTa || 'பராமரிப்பு / தனியார் நிகழ்வு') : (blockedDetails?.reasonEn || 'Maintenance / Private Event')}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isDateAvailable && (
                                <TranslatableTextarea 
                                    label={t('adminMandapam.calendar.reasonBlocking') || 'Reason For Blocking'}
                                    valueEn={reasonEn}
                                    valueTa={reasonTa}
                                    onChangeEn={setReasonEn}
                                    onChangeTa={setReasonTa}
                                    placeholder={t('adminMandapam.calendar.reasonPlaceholder') || 'Enter internal notes or reason...'}
                                />
                            )}
                        </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 border-t border-gold/10 pt-5">
                    <p className="grow text-[11px] text-rosewood/40 italic flex items-center gap-1">
                        <Info size={14} /> {t('adminMandapam.calendar.blockingWarning') || 'Blocking this date prevents any new inquiries.'}
                    </p>
                    <div className="flex flex-row gap-3 w-full sm:w-auto">
                        {isDateBlocked && (
                            <button 
                                onClick={handleUnblock}
                                disabled={unblockMutation.isPending}
                                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-rosewood-gradient border-2 border-gold/20 text-rosewood hover:shadow-md hover:border-gold/40 transition-all shadow-sm"
                            >
                                {unblockMutation.isPending ? <div className="w-4 h-4 border-2 border-rosewood border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
                                {t('adminMandapam.calendar.unblockDate') || 'Unblock Date'}
                            </button>
                        )}
                        {isDateBooked && (
                            <button 
                                onClick={() => setIsBookingModalOpen(true)}
                                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 bg-linear-to-br from-gold/30 via-ivory to-gold/30 text-rosewood hover:shadow-lg"
                            >
                                <PlusCircle size={16} />
                                {t('adminMandapam.bookings.addNewBooking') || 'Create Booking'}
                            </button>
                        )}
                        {isDateAvailable && (
                            <>
                                <button 
                                    onClick={() => setIsBookingModalOpen(true)}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 bg-linear-to-br from-gold/30 via-ivory to-gold/30 text-rosewood hover:shadow-lg"
                                >
                                    <PlusCircle size={16} />
                                    {t('adminMandapam.bookings.addNewBooking') || 'Create Booking'}
                                </button>
                                <button 
                                    onClick={handleBlock}
                                    disabled={blockMutation.isPending}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-rosewood-gradient border-2 border-gold/20 text-rosewood hover:shadow-md hover:border-gold/40 shadow-sm"
                                >
                                    {blockMutation.isPending ? <div className="w-4 h-4 border-2 border-rosewood border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                                    {t('adminMandapam.calendar.blockFullDay') || 'Block Full Day'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <NewBookingModal 
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                t={t}
                initialDate={selectedDateStr || ''}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-calendar'] });
                    if (selectedDateStr) {
                        queryClient.invalidateQueries({ queryKey: ['admin-bookings', selectedDateStr] });
                    }
                }}
            />
            </div>
        </div>
    );
};
