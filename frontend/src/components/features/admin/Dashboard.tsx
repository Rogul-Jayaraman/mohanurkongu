import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { useNavigate } from 'react-router-dom';
import {
    Users, CheckCircle, CalendarDays,
    CalendarPlus, Package,
    CalendarClock, User, AlertCircle, ShieldCheck
} from 'lucide-react';
import { StatCard } from '@/components/ui/cards/StatCard';
import { ActionCard } from '@/components/ui/cards/ActionCard';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { ContentCard } from '@/components/ui/cards/ContentCard';
import { AdminProfileCard } from '@/components/features/admin/matrimony/ProfileCard';
import { AdminProfileCardSkeleton } from '@/components/features/admin/matrimony/ProfileCardSkeleton';
import { useAdminStatsQuery, useAdminVerificationQuery } from '@/hooks/queries/useAdminMatrimony';

// ═══════════════════════════════════════════════════════════
// AdminWelcomeHeader
// ═══════════════════════════════════════════════════════════
const AdminWelcomeHeader: React.FC = () => {
    const { language } = useLanguage();
    const { formatDate } = useDateFormatter();
    const isTamil = language === 'ta';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return isTamil ? 'இனிய காலை வணக்கம்' : 'Good Morning';
        if (hour < 17) return isTamil ? 'இனிய மதிய வணக்கம்' : 'Good Afternoon';
        return isTamil ? 'இனிய மாலை வணக்கம்' : 'Good Evening';
    };

    return (
        <div className="w-full">
            <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-serif font-black text-gold tracking-[0.15em]">{getGreeting()}</span>
                <div className="flex flex-col md:flex-row md:justify-between gap-x-6">
                    <h1 className="text-2xl font-serif font-black text-rosewood tracking-tight">{isTamil ? 'வரவேற்கிறோம், நிர்வாகி' : 'Welcome, Admin'}</h1>
                    <div className="flex items-center gap-2 text-rosewood translate-y-[-2px]">
                        <div className="w-1 h-1 rounded-full bg-gold" />
                        <span className="text-xs font-serif font-bold italic tracking-wide">{formatDate(new Date())}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// GlobalKPIs
// ═══════════════════════════════════════════════════════════
const GlobalKPIs: React.FC<{ stats: any; isLoading: boolean }> = ({ stats, isLoading }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';

    const kpis = [
        { label: isTamil ? 'மொத்த பயனர்கள்' : 'Total Users', value: stats ? (stats.totalUsers ?? 0).toLocaleString() : '', icon: Users, color: 'text-rosewood bg-ivory-dark' },
        { label: isTamil ? 'சரிபார்ப்பு காத்திருப்பு' : 'Pending Verification', value: stats ? (stats.pendingVerifications ?? 0).toString() : '', icon: CheckCircle, color: 'text-gold bg-ivory-dark' },
        { label: isTamil ? 'இன்றைய முன்பதிவுகள்' : "Today's Bookings", value: stats ? (stats.bookingsToday ?? 0).toString() : '', icon: CalendarDays, color: 'text-dark-brown bg-ivory-dark' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi, i) => (
                <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} color={kpi.color} delay={i * 0.1} isLoading={isLoading} />
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// TodaysBookings
// ═══════════════════════════════════════════════════════════
interface MandapamEvent {
    eventId: string;
    eventTitleTa: string;
    eventTitleEn: string;
    session: string;
    nameTa: string;
    nameEn: string;
    phone: string;
    paymentStatus: string;
}

const TodaysBookings: React.FC<{ recentBookings: MandapamEvent[]; isLoading: boolean }> = ({ recentBookings, isLoading }) => {
    const { language, t } = useLanguage();
    const isTamil = language === 'ta';

    const sessionLabels: Record<string, string> = {
        'MORNING': t('adminMandapam.bookings.morning'),
        'EVENING': t('adminMandapam.bookings.evening'),
        'FULL_DAY': t('adminMandapam.bookings.fullDay')
    };
    const statusLabels: Record<string, string> = {
        'FULLY_PAID': t('adminMandapam.bookings.fullyPaid'),
        'ADVANCE': t('adminMandapam.bookings.advance'),
        'NOT_PAID': t('adminMandapam.bookings.notPaid')
    };

    const eventsToDisplay = recentBookings || [];

    return (
        <div className="w-full space-y-6">
            <SectionHeader title={isTamil ? 'இன்றைய நிகழ்வுகள்' : "Today's Schedule"} icon={CalendarClock} />
            <div className="space-y-4">
                {isLoading ? (
                    [1, 2, 3].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gold/10 overflow-hidden shadow-sm flex flex-col md:flex-row animate-pulse h-32">
                            <div className="md:w-32 bg-slate-50 shrink-0 border-b md:border-b-0 md:border-r border-gold/15" />
                            <div className="grow p-6 space-y-4">
                                <div className="h-6 w-1/2 bg-slate-100 rounded-lg" />
                                <div className="flex gap-4"><div className="h-6 w-24 bg-slate-50 rounded-md" /><div className="h-6 w-24 bg-slate-50 rounded-md" /></div>
                            </div>
                            <div className="md:w-48 p-6 bg-slate-50/30 flex items-center justify-center" />
                        </div>
                    ))
                ) : eventsToDisplay.length > 0 ? (
                    eventsToDisplay.map((event, i) => (
                        <motion.div key={event.eventId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <ContentCard noPadding className="flex flex-col md:flex-row">
                                <div className="md:w-32 bg-ivory flex flex-col items-center justify-center p-4 shrink-0 border-b md:border-b-0 md:border-r border-gold/15">
                                    <span className="px-2 py-0.5 bg-[#788a7b]/10 text-[#4a5a4d] text-[10px] font-bold rounded-md mb-2">{event.eventId}</span>
                                    <span className="text-sm font-serif font-bold text-rosewood uppercase tracking-tight text-center">{sessionLabels[event.session] || event.session}</span>
                                </div>
                                <div className="grow p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gold/10">
                                    <h4 className="text-xl font-serif font-black text-rosewood leading-tight mb-2">{isTamil ? event.eventTitleTa : event.eventTitleEn}</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gold/5 rounded-md shadow-xs">
                                            <User size={12} className="text-gold" />
                                            <span className="text-[11px] font-bold text-slate-700">{isTamil ? event.nameTa : event.nameEn}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gold/5 rounded-md shadow-xs">
                                            <span className="text-[10px] font-black text-gold/40 uppercase">Tel</span>
                                            <span className="text-[11px] font-bold text-slate-700 tabular-nums">{event.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-48 p-6 flex flex-col justify-center items-center md:items-end bg-white/40">
                                    <span className="text-[11px] font-black text-rosewood mb-2 leading-none uppercase tracking-widest">{t('adminMandapam.bookings.paymentStatus')}</span>
                                    <div className="px-3 py-1 bg-[#788a7b]/10 border border-[#788a7b]/20 rounded-lg">
                                        <span className="text-xs font-black text-[#5a584a] tracking-widest uppercase">{statusLabels[event.paymentStatus] || event.paymentStatus}</span>
                                    </div>
                                </div>
                            </ContentCard>
                        </motion.div>
                    ))
                ) : (
                    <EmptyState message={isTamil ? 'இன்று எந்த நிகழ்வுகளும் இல்லை' : 'The registry is clear for today.'} />
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// VerificationQueuePreview
// ═══════════════════════════════════════════════════════════
const VerificationQueuePreview: React.FC = () => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const navigate = useNavigate();
    const { data, isLoading } = useAdminVerificationQuery({ limit: 4 });
    const profiles = data?.profiles || [];

    const handleAccept = (id: string) => console.log('Accepted:', id);
    const handleReject = (id: any) => console.log('Rejected:', id);

    return (
        <div className="w-full space-y-6">
            <SectionHeader title={isTamil ? 'சரிபார்ப்பு வரிசை' : 'Verification Queue'} icon={ShieldCheck} />
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => <AdminProfileCardSkeleton key={i} />)}
                </div>
            ) : profiles.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {profiles.map((profile: any, i: number) => (
                        <motion.div key={profile.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="w-full">
                            <AdminProfileCard profile={profile} adminActions={{ onAccept: handleAccept, onReject: handleReject, onView: (id) => navigate(`/admin/matrimony/profiles/${id}`) }} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState message={isTamil ? 'சரிபார்ப்பு வரிசை காலியாக உள்ளது' : 'All profiles are verified. Queue cleared.'} icon={ShieldCheck} />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// QuickActions
// ═══════════════════════════════════════════════════════════
const QuickActions: React.FC = () => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const navigate = useNavigate();

    const actions = [
        { id: '1', title: 'New Booking', titleTa: 'புதிய முன்பதிவு', description: 'Create a new hall booking for a client.', descriptionTa: 'ஒரு வாடிக்கையாளருக்கு புதிய முன்பதிவை உருவாக்கவும்.', icon: CalendarPlus, route: '/admin/mandapam/bookings/new' },
        { id: '2', title: 'Hall Availability', titleTa: 'அரங்கு காலியிடம்', description: 'Check available dates for events.', descriptionTa: 'நிகழ்ச்சிகளுக்கான கிடைக்கும் தேதிகளைச் சரிபார்க்கவும்.', icon: CalendarDays, route: '/admin/mandapam/availability' },
        { id: '3', title: 'Package Management', titleTa: 'தொகுப்பு மேலாண்மை', description: 'Manage pricing and event packages.', descriptionTa: 'விலை மற்றும் நிகழ்வு தொகுப்புகளை நிர்வகிக்கவும்.', icon: Package, route: '/admin/mandapam/packages' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {actions.map((action, i) => (
                <ActionCard key={action.id} title={isTamil ? action.titleTa : action.title} description={isTamil ? action.descriptionTa : action.description} icon={action.icon} onClick={() => navigate(action.route)} delay={i * 0.1} />
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// AdminDashboard (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const AdminDashboard: React.FC = () => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const { data, isLoading: loading, isError, error, refetch } = useAdminStatsQuery();

    if (isError && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-16 h-16 text-red-500/50" />
                <h3 className="text-2xl font-serif font-bold text-rosewood">{isTamil ? 'சிஸ்டம் ஆஃப்லைனில் உள்ளது' : 'System Offline'}</h3>
                <p className="text-gray-500 max-w-md text-center">{(error as any)?.message || (isTamil ? 'டாஷ்போர்டு தரவை ஏற்ற முடியவில்லை' : 'Failed to load dashboard statistics')}</p>
                <button onClick={() => refetch()} className="mt-4 px-8 py-3 bg-rosewood text-white font-bold rounded-xl hover:shadow-lg transition-all">{isTamil ? 'மீண்டும் இணைக்கவும்' : 'Re-establish Connection'}</button>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 animate-fadeIn">
            <AdminWelcomeHeader />
            <section><GlobalKPIs stats={data?.stats} isLoading={loading} /></section>
            <section><TodaysBookings recentBookings={data?.recentBookings || []} isLoading={loading} /></section>
            <section><VerificationQueuePreview /></section>
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold text-gold">{isTamil ? 'செயல்பாடுகள் மையம்' : 'Action Center'}</h3>
                    <div className="h-px grow bg-gold/10" />
                </div>
                <QuickActions />
            </section>
        </div>
    );
};

export default AdminDashboard;
