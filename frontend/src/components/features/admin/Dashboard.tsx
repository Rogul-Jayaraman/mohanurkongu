import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { useNavigate } from 'react-router-dom';
import {
    Users, CheckCircle, CalendarDays,
    CalendarPlus, Package,
    CalendarClock, User, AlertCircle, ShieldCheck, CalendarX
} from 'lucide-react';
import { StatCard } from '@/components/ui/cards/StatCard';
import { ActionCard } from '@/components/ui/cards/ActionCard';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { ContentCard } from '@/components/ui/cards/ContentCard';
import { AdminProfileCard } from '@/components/features/admin/matrimony/ProfileCard';
import { AdminProfileCardSkeleton } from '@/components/features/admin/matrimony/ProfileCardSkeleton';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from '@/api/admin-dashboard.api';
import { useVerificationQueueQuery } from '@/queries/useProfileQueries';
import AdminDashboardSkeleton from '@/components/features/admin/skeletons/AdminDashboardSkeleton';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
interface TodaysEvent {
    eventId: string;
    eventTitleTa: string;
    eventTitleEn: string;
    session: string;
    nameTa: string;
    nameEn: string;
    phone: string;
    paymentStatus: string;
    bookingNo: string;
}

interface DashboardStats {
    stats: {
        totalUsers: number;
        totalProfiles: number;
        activeProfiles: number;
        totalBookings: number;
        totalRevenue: number;
        newUsers: number;
        pendingVerifications: number;
        bookingsToday: number;
    };
    todaysEvents: TodaysEvent[];
}

// ═══════════════════════════════════════════════════════════
// AdminWelcomeHeader
// ═══════════════════════════════════════════════════════════
const AdminWelcomeHeader: React.FC = () => {
    const { t } = useLanguage();
    const { formatDate } = useDateFormatter();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('adminMatrimony.dashboard.greeting.morning');
        if (hour < 17) return t('adminMatrimony.dashboard.greeting.afternoon');
        return t('adminMatrimony.dashboard.greeting.evening');
    };

    return (
        <div className="w-full">
            <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-serif font-black text-gold tracking-[0.15em]">{getGreeting()}</span>
                <div className="flex flex-col md:flex-row md:justify-between gap-x-6">
                    <h1 className="text-2xl font-serif font-black text-rosewood tracking-tight">{t('adminMatrimony.dashboard.welcomeAdmin')}</h1>
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
const GlobalKPIs: React.FC<{ stats: DashboardStats['stats'] | undefined; isLoading: boolean }> = ({ stats, isLoading }) => {
    const { t } = useLanguage();

    const kpis = [
        { label: t('adminMatrimony.dashboard.totalUsers'), value: stats ? (stats.totalUsers ?? 0).toLocaleString() : '', icon: Users, color: 'text-rosewood bg-ivory-dark' },
        { label: t('adminMatrimony.dashboard.pendingVerifications'), value: stats ? (stats.pendingVerifications ?? 0).toString() : '', icon: CheckCircle, color: 'text-gold bg-ivory-dark' },
        { label: t('adminMatrimony.dashboard.todaysBookings'), value: stats ? (stats.bookingsToday ?? 0).toString() : '', icon: CalendarDays, color: 'text-dark-brown bg-ivory-dark' }
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
// TodaysSchedule
// ═══════════════════════════════════════════════════════════
const TodaysSchedule: React.FC<{ events: TodaysEvent[]; isLoading: boolean }> = ({ events, isLoading }) => {
    const { language, t } = useLanguage();
    const isTamil = language === 'ta';

    const sessionLabels: Record<string, string> = {
        'MORNING': isTamil ? 'காலை' : 'Morning',
        'EVENING': isTamil ? 'மாலை' : 'Evening',
        'FULL_DAY': isTamil ? 'முழு நாள்' : 'Full Day'
    };
    const statusLabels: Record<string, string> = {
        'FULLY_PAID': t('adminMandapam.bookings.fullyPaid'),
        'ADVANCE': t('adminMandapam.bookings.advance'),
        'NOT_PAID': t('adminMandapam.bookings.notPaid')
    };
    const statusColors: Record<string, string> = {
        'FULLY_PAID': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'ADVANCE': 'bg-amber-50 text-amber-700 border-amber-200',
        'NOT_PAID': 'bg-red-50 text-red-700 border-red-200'
    };

    if (isLoading) {
        return (
            <div className="w-full space-y-6">
                <SectionHeader title={t('adminMatrimony.dashboard.todaysSchedule')} icon={CalendarClock} />
                <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gold/10 overflow-hidden shadow-sm flex flex-col md:flex-row animate-pulse h-32">
                            <div className="md:w-32 bg-slate-50 shrink-0 border-b md:border-b-0 md:border-r border-gold/15" />
                            <div className="grow p-6 space-y-4">
                                <div className="h-6 w-1/2 bg-slate-100 rounded-lg" />
                                <div className="flex gap-4"><div className="h-6 w-24 bg-slate-50 rounded-md" /><div className="h-6 w-24 bg-slate-50 rounded-md" /></div>
                            </div>
                            <div className="md:w-48 p-6 bg-slate-50/30 flex items-center justify-center" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="w-full space-y-6">
                <SectionHeader title={t('adminMatrimony.dashboard.todaysSchedule')} icon={CalendarClock} />
                <EmptyState
                    message={t('adminMatrimony.dashboard.noEventsToday')}
                    description={isTamil ? 'இன்று எந்த நிகழ்வுகளும் திட்டமிடப்படவில்லை.' : 'No events are scheduled for today.'}
                    icon={CalendarX}
                />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <SectionHeader title={t('adminMatrimony.dashboard.todaysSchedule')} icon={CalendarClock} />
            <div className="space-y-4">
                {events.map((event, i) => (
                    <motion.div key={event.eventId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <ContentCard noPadding className="flex flex-col md:flex-row">
                            <div className="md:w-32 bg-ivory flex flex-col items-center justify-center p-4 shrink-0 border-b md:border-b-0 md:border-r border-gold/15">
                                <span className="px-2 py-0.5 bg-[#788a7b]/10 text-[#4a5a4d] text-[10px] font-bold rounded-md mb-2">{event.bookingNo}</span>
                                <span className="text-sm font-serif font-bold text-rosewood uppercase tracking-tight text-center">{sessionLabels[event.session] || event.session}</span>
                            </div>
                            <div className="grow p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gold/10">
                                <h4 className="text-xl font-serif font-black text-rosewood leading-tight mb-2">{isTamil ? event.eventTitleTa : event.eventTitleEn}</h4>
                                <div className="flex items-center gap-3 flex-wrap">
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
                                <div className={`px-3 py-1 rounded-lg border ${statusColors[event.paymentStatus] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    <span className="text-xs font-black tracking-widest uppercase">{statusLabels[event.paymentStatus] || event.paymentStatus}</span>
                                </div>
                            </div>
                        </ContentCard>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// VerificationQueuePreview
// ═══════════════════════════════════════════════════════════
const VerificationQueuePreview: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queueQuery = useVerificationQueueQuery({ limit: 4 });
    const profiles: any[] = (queueQuery.data as any)?.profiles ?? [];
    const isLoading = queueQuery.isPending;

    return (
        <div className="w-full space-y-6">
            <SectionHeader title={t('adminMatrimony.dashboard.verificationQueue')} icon={ShieldCheck} />
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => <AdminProfileCardSkeleton key={i} />)}
                </div>
            ) : profiles.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {profiles.map((profile: any, i: number) => (
                        <motion.div key={profile.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="w-full">
                            <AdminProfileCard profile={profile} adminActions={{ onView: (id) => navigate(`/admin/matrimony/profiles/${id}`) }} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState message={t('adminMatrimony.dashboard.queueCleared')} icon={ShieldCheck} />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// QuickActions
// ═══════════════════════════════════════════════════════════
const QuickActions: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const actions = [
        { id: '1', title: t('adminMatrimony.dashboard.newBooking.title'), description: t('adminMatrimony.dashboard.newBooking.desc'), icon: CalendarPlus, route: '/admin/mandapam/bookings/new' },
        { id: '2', title: t('adminMatrimony.dashboard.hallAvailability.title'), description: t('adminMatrimony.dashboard.hallAvailability.desc'), icon: CalendarDays, route: '/admin/mandapam/availability' },
        { id: '3', title: t('adminMatrimony.dashboard.packageManagement.title'), description: t('adminMatrimony.dashboard.packageManagement.desc'), icon: Package, route: '/admin/mandapam/packages' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {actions.map((action, i) => (
                <ActionCard key={action.id} title={action.title} description={action.description} icon={action.icon} onClick={() => navigate(action.route)} delay={i * 0.1} />
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// AdminDashboard (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const AdminDashboard: React.FC = () => {
    const { t } = useLanguage();
    const statsQuery = useQuery({
        queryKey: ['admin', 'dashboard', 'stats'],
        queryFn: fetchAdminStats,
        staleTime: 30_000,
    });

    const statsData: DashboardStats | undefined = statsQuery.data as any;
    const loading = statsQuery.isPending;
    const isError = statsQuery.isError;

    if (loading && !statsQuery.data) {
        return <AdminDashboardSkeleton />;
    }

    if (isError && !statsQuery.data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-16 h-16 text-red-500/50" />
                <h3 className="text-2xl font-serif font-bold text-rosewood">{t('adminMatrimony.dashboard.systemOffline')}</h3>
                <p className="text-gray-500 max-w-md text-center">{(statsQuery.error as any)?.message || t('adminMatrimony.dashboard.loadError')}</p>
                <button onClick={() => statsQuery.refetch()} className="mt-4 px-8 py-3 bg-rosewood text-white font-bold rounded-xl hover:shadow-lg transition-all">{t('adminMatrimony.dashboard.retryConnection')}</button>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 animate-fadeIn">
            <AdminWelcomeHeader />
            <section><GlobalKPIs stats={statsData?.stats} isLoading={loading} /></section>
            <section><TodaysSchedule events={statsData?.todaysEvents || []} isLoading={loading} /></section>
            <section><VerificationQueuePreview /></section>
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold text-gold">{t('adminMatrimony.dashboard.actionCenter')}</h3>
                    <div className="h-px grow bg-gold/10" />
                </div>
                <QuickActions />
            </section>
        </div>
    );
};

export default AdminDashboard;
