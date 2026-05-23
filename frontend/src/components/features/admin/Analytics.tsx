import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldCheck, Users, TrendingUp, DollarSign, Calendar, BarChart3, Filter, Package, Clock } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import CentralToggleButton from '@/components/ui/forms/CentralToggleButton';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { stubFetchAnalyticsData, stubFetchBasicStats } from '@/utils/stubs';
import type { AnalyticsData, BasicStats } from '@/types/admin-types';

const CHART_COLORS = ['#D4AF37', '#8B1D3D', '#819683', '#e2a5a5', '#6b0028'];

const aggregateByMonth = (data: any[], dateKey: string, valueKey: string) => {
    const monthly: Record<string, number> = {};
    (data || []).forEach(item => {
        const rawDate = item[dateKey];
        if (!rawDate) return;
        const date = new Date(rawDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + (Number(item[valueKey]) || 0);
    });
    return Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// ═══════════════════════════════════════════════════════════
// GlassStatCard
// ═══════════════════════════════════════════════════════════
const GlassStatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading?: boolean }> = ({ title, value, icon, loading }) => (
    <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden p-6 group">
        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-rosewood/50">{title}</span>
                <div className="size-9 rounded-xl bg-rosewood-gradient flex items-center justify-center shadow-md shrink-0">{icon}</div>
            </div>
            {loading ? <div className="h-9 w-24 bg-gold/10 animate-pulse rounded-lg" /> : <h3 className="text-3xl font-serif font-black text-rosewood leading-none tracking-tight">{value}</h3>}
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// AnalyticsHeader
// ═══════════════════════════════════════════════════════════
const AnalyticsHeader: React.FC<{ activeTab: string; onTabChange: (tab: 'matrimony' | 'mandapam') => void }> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation(['analytics', 'common', 'profile_new']);
    return (
        <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10">
                <div className="px-6 py-6 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                            <h3 className="text-3xl font-serif font-black text-rosewood tracking-tight">{activeTab === 'matrimony' ? t('title.matrimony') : t('title.mandapam')}</h3>
                        </div>
                        <CentralToggleButton
                            value={activeTab}
                            onChange={(val) => onTabChange(val as 'matrimony' | 'mandapam')}
                            options={[
                                { value: 'matrimony', label: { en: 'Matrimony', ta: 'திருமணம்' } },
                                { value: 'mandapam', label: { en: 'Mandapam', ta: 'மண்டபம்' } }
                            ]}
                            variant="rosewood"
                            name="analytics-tab"
                            glass
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// AreaChartCard
// ═══════════════════════════════════════════════════════════
const AreaChartCard: React.FC<{ title: string; subtitle?: string; data: { date: string; value: number }[]; gradientId: string; loading?: boolean; noHover?: boolean }> = ({ title, subtitle, data, gradientId, loading, noHover }) => {
    const { t } = useTranslation('analytics');
    if (loading) return <GlassLoadingSection title={title} subtitle={subtitle} />;
    return (
        <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden h-full">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
                    <h3 className="text-xl font-serif font-black text-rosewood">{title}</h3>
                    {subtitle && <p className="text-[9px] text-gold font-black uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex-1 p-6">
                    {data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <BarChart3 size={40} className="text-sage" />
                            <p className="text-[10px] font-bold text-sage uppercase tracking-[0.2em] mt-3">{t('charts.noData')}</p>
                        </div>
                    ) : (
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} /><stop offset="95%" stopColor="#D4AF37" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.4} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#819683', fontSize: 10, fontFamily: 'Poppins' }} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#819683', fontSize: 10, fontFamily: 'Poppins' }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontSize: '11px', fontFamily: 'Poppins' }} />
                                    <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2.5} fill={`url(#${gradientId})`} dot={noHover ? false : { r: 3, fill: '#D4AF37', strokeWidth: 2, stroke: '#fff' }} activeDot={noHover ? false : { r: 5, strokeWidth: 0 }} animationDuration={1500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// DonutChartCard
// ═══════════════════════════════════════════════════════════
const DonutChartCard: React.FC<{ title: string; subtitle?: string; data: { name: string; value: number }[]; colors: string[]; centerLabel?: string; loading?: boolean }> = ({ title, subtitle, data, colors, centerLabel, loading }) => {
    const { t } = useTranslation('analytics');
    if (loading) return <GlassLoadingSection title={title} subtitle={subtitle} />;
    const displayData = data.length > 0 ? data : [{ name: t('charts.noData'), value: 1 }];
    const displayColors = data.length > 0 ? colors : ['#F3F4F6'];
    return (
        <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden h-full">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
                    <h3 className="text-xl font-serif font-black text-rosewood">{title}</h3>
                    {subtitle && <p className="text-[9px] text-gold font-black uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="size-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={displayData} cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" paddingAngle={4} dataKey="value" animationDuration={1500} stroke="none">
                                    {displayData.map((_, index) => <Cell key={`cell-${index}`} fill={displayColors[index % displayColors.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', fontSize: '11px', fontFamily: 'Poppins' }} />
                                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', paddingTop: '16px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {centerLabel && <div className="text-center"><span className="text-[9px] font-black text-rosewood/40 uppercase tracking-widest">{t('charts.total')}</span><p className="text-lg font-serif font-black text-rosewood">{centerLabel}</p></div>}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// FunnelBarCard
// ═══════════════════════════════════════════════════════════
const FunnelBarCard: React.FC<{ title: string; subtitle?: string; data: { name: string; value: number; percentage: number }[]; loading?: boolean }> = ({ title, subtitle, data, loading }) => {
    const { t } = useTranslation('analytics');
    if (loading) return <GlassLoadingSection title={title} subtitle={subtitle} />;
    return (
        <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden h-full">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
                    <h3 className="text-xl font-serif font-black text-rosewood">{title}</h3>
                    {subtitle && <p className="text-[9px] text-gold font-black uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex-1 p-6">
                    {data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Filter size={40} className="text-sage" />
                            <p className="text-[10px] font-bold text-sage uppercase tracking-[0.2em] mt-3">{t('charts.noFunnel')}</p>
                        </div>
                    ) : (
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.4} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#819683', fontSize: 10, fontFamily: 'Poppins' }} hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#819683', fontSize: 9, fontFamily: 'Poppins', fontWeight: 600 }} width={100} />
                                    <Tooltip cursor={{ fill: 'rgba(249,250,251,0.5)' }} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', fontSize: '11px', fontFamily: 'Poppins' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28} animationDuration={1500}>
                                        {data.map((entry, index) => <Cell key={index} fill={index === 0 ? '#D4AF37' : index === data.length - 1 ? '#8B1D3D' : `rgba(212,175,55,${0.3 + (entry.percentage / 100) * 0.7})`} />)}
                                        <LabelList dataKey="value" position="right" content={({ x, y, width, height, value, index }: any) => {
                                            if (index === undefined) return null;
                                            const pct = data[index]?.percentage ?? 0;
                                            return <text x={Number(x) + Number(width) + 8} y={Number(y) + Number(height) / 2 + 4} fill="#8B1D3D" fontSize={10} fontWeight={700} fontFamily="Poppins" dominantBaseline="middle">{value} ({pct}%)</text>;
                                        }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// HorizontalBarCard
// ═══════════════════════════════════════════════════════════
const HorizontalBarCard: React.FC<{ title: string; subtitle?: string; data: { name: string; value: number }[]; colors?: string[]; valueSuffix?: string; loading?: boolean }> = ({ title, subtitle, data, colors = CHART_COLORS, valueSuffix = '', loading }) => {
    const { t } = useTranslation('analytics');
    if (loading) return <GlassLoadingSection title={title} subtitle={subtitle} />;
    return (
        <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden h-full">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
                    <h3 className="text-xl font-serif font-black text-rosewood">{title}</h3>
                    {subtitle && <p className="text-[9px] text-gold font-black uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex-1 p-6">
                    {data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Package size={40} className="text-sage" />
                            <p className="text-[10px] font-bold text-sage uppercase tracking-[0.2em] mt-3">{t('charts.noData')}</p>
                        </div>
                    ) : (
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.4} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#819683', fontSize: 10, fontFamily: 'Poppins' }} hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#819683', fontSize: 9, fontFamily: 'Poppins', fontWeight: 600 }} width={100} />
                                    <Tooltip cursor={{ fill: 'rgba(249,250,251,0.5)' }} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', fontSize: '11px', fontFamily: 'Poppins' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1500}>
                                        {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                                        <LabelList dataKey="value" position="right" content={({ x, y, width, height, value }: any) => (
                                            <text x={Number(x) + Number(width) + 8} y={Number(y) + Number(height) / 2 + 4} fill="#8B1D3D" fontSize={10} fontWeight={700} fontFamily="Poppins" dominantBaseline="middle">{value}{valueSuffix}</text>
                                        )} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// ComparisonBarCard
// ═══════════════════════════════════════════════════════════
const ComparisonBarCard: React.FC<{ title: string; subtitle?: string; data: { name: string; value: number; color: string }[]; loading?: boolean }> = ({ title, subtitle, data, loading }) => {
    const { t } = useTranslation('analytics');
    if (loading) return <GlassLoadingSection title={title} subtitle={subtitle} />;
    return (
        <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden h-full">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
                    <h3 className="text-xl font-serif font-black text-rosewood">{title}</h3>
                    {subtitle && <p className="text-[9px] text-gold font-black uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center opacity-40">
                            <Clock size={40} className="text-sage" />
                            <p className="text-[10px] font-bold text-sage uppercase tracking-[0.2em] mt-3">{t('charts.noData')}</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-md space-y-8">
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.4} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#819683', fontSize: 10, fontFamily: 'Poppins', fontWeight: 600 }} dy={8} />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', fontSize: '11px', fontFamily: 'Poppins' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60} animationDuration={1500}>
                                            {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            <LabelList dataKey="value" position="top" style={{ fill: '#8B1D3D', fontSize: 14, fontWeight: 700, fontFamily: 'Poppins' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {data.length === 2 && <div className="flex justify-center gap-8">{data.map((entry, i) => <div key={i} className="text-center"><div className="text-2xl font-serif font-black text-rosewood">{Math.round((entry.value / (data[0].value + data[1].value)) * 100)}%</div><div className="text-[9px] font-black text-rosewood/40 uppercase tracking-widest">{entry.name}</div></div>)}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// GlassLoadingSection
// ═══════════════════════════════════════════════════════════
const GlassLoadingSection: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden h-full animate-pulse">
        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
            <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
                {title && <div className="h-6 w-48 bg-gold/10 rounded" />}
                {subtitle && <div className="h-3 w-32 bg-gold/5 rounded mt-2" />}
            </div>
            <div className="flex-1 p-6"><div className="h-full w-full bg-gold/5 rounded-xl" /></div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// StatusAlert
// ═══════════════════════════════════════════════════════════
const StatusAlert: React.FC<{ analyticsData: any; isLoading: boolean; activeTab: string }> = ({ analyticsData, isLoading, activeTab }) => {
    const { t } = useTranslation(['analytics', 'common', 'profile_new']);
    const getStatusAlert = () => {
        if (!analyticsData && !isLoading) return t('status.connected');
        if (isLoading) return t('status.loading');
        if (activeTab === 'matrimony') {
            if (analyticsData?.matrimony?.pending > 10) return t('status.backlog');
            return t('status.stable');
        }
        const pendingBookings = (analyticsData?.bookings?.total || 0) - (analyticsData?.bookings?.completed || 0);
        if (pendingBookings > 5) return t('status.bookingsReview', { count: pendingBookings });
        return t('status.seamless');
    };
    return (
        <div className="relative bg-white/10 backdrop-blur-2xl border border-gold/30 rounded-xl  overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 px-6 py-6 flex items-center gap-4">
                <div className="size-12 shrink-0 rounded-xl bg-rosewood-gradient flex items-center justify-center shadow-md"><ShieldCheck size={24} className="text-gold" /></div>
                <div>
                    <p className="text-[9px] font-black text-rosewood/50 uppercase tracking-[0.2em] mb-0.5">{t('status.watch')}</p>
                    <h4 className="text-sm font-serif font-black text-rosewood leading-tight">{getStatusAlert()}</h4>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// Analytics (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const Analytics: React.FC = () => {
    const { language } = useLanguage();
    const { t } = useTranslation(['analytics', 'common', 'profile_new']);
    const [activeTab, setActiveTab] = useState<'matrimony' | 'mandapam'>('matrimony');
    const [fullData, setFullData] = useState<any>({ matrimony: { total: 0, verified: 0, premium: 0 }, revenue: { trends: { matrimony: [], mandapam: [] }, highlights: { matrimony: 0, bookings: 0 } }, bookings: { total: 0, trend: [], slots_utilization: [] }, users: { total: 0, newThisMonth: 0 }, distributions: { gender: [], district: [], plan: { basic: 0, premium: 0 } }, funnels: { matrimony: [], booking: [] }, packages: { distribution: [] }, topPackages: [], recentActivity: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const refetch = () => { setIsLoading(true); stubFetchAnalyticsData().then(setFullData).catch(() => setIsError(true)).finally(() => setIsLoading(false)); };
    useEffect(() => { refetch(); }, []);
    const [basicStats, setBasicStats] = useState<any>({ totalUsers: 0, totalProfiles: 0, totalBookings: 0, totalRevenue: 0, recentUsers: 0, pendingVerifications: 0, matrimony: { total: 0, verified: 0, premium: 0 }, mandapam: { total: 0, completed: 0 }, revenue: { matrimony: 0, mandapam: 0 } });
    const [statsLoading, setStatsLoading] = useState(true);
    useEffect(() => { stubFetchBasicStats().then(setBasicStats).finally(() => setStatsLoading(false)); }, []);

    if (isError && !fullData) {
        return (
            <div className="relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl  overflow-hidden m-4 sm:m-8">
                <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="size-20 bg-rosewood-gradient rounded-full flex items-center justify-center shadow-md"><AlertCircle size={40} className="text-gold" /></div>
                    <h2 className="text-xl font-serif text-rosewood uppercase tracking-widest font-black">{t('status.unavailable')}</h2>
                    <button onClick={() => refetch()} className="px-8 py-3 bg-rosewood-gradient text-gold text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-lg transition-all shadow-md">{t('status.retry')}</button>
                </div>
            </div>
        );
    }

    const matriRevenueMonthly = useMemo(() => aggregateByMonth(fullData?.revenue?.trends?.matrimony || [], 'createdAt', 'amount'), [fullData?.revenue?.trends?.matrimony]);
    const mandapamRevenueMonthly = useMemo(() => aggregateByMonth(fullData?.revenue?.trends?.mandapam || [], 'date', 'totalAmount'), [fullData?.revenue?.trends?.mandapam]);
    const bookingTrendMonthly = useMemo(() => aggregateByMonth(fullData?.bookings?.trend || [], 'date', 'count'), [fullData?.bookings?.trend]);
    const genderData = useMemo(() => (fullData?.distributions?.gender || []).map((g: any) => ({ name: g.label === 'MALE' ? t('genders.MALE') : g.label === 'FEMALE' ? t('genders.FEMALE') : g.label, value: g.count })), [fullData?.distributions?.gender, t]);
    const districtData = useMemo(() => (fullData?.distributions?.district || []).sort((a: any, b: any) => b.count - a.count).slice(0, 10).map((d: any) => ({ name: d.label, value: d.count })), [fullData?.distributions?.district]);
    const matriFunnelData = useMemo(() => (fullData?.funnels?.matrimony || []).map((s: any, _: number, arr: any[]) => ({ name: s.label, value: s.count, percentage: arr[0]?.count > 0 ? Math.round((s.count / arr[0].count) * 100) : 0 })), [fullData?.funnels?.matrimony]);
    const bookingFunnelData = useMemo(() => (fullData?.funnels?.booking || []).map((s: any, _: number, arr: any[]) => ({ name: s.label, value: s.count, percentage: arr[0]?.count > 0 ? Math.round((s.count / arr[0].count) * 100) : 0 })), [fullData?.funnels?.booking]);
    const packageData = useMemo(() => (fullData?.packages?.distribution || []).sort((a: any, b: any) => b.count - a.count).map((p: any) => ({ name: language === 'ta' ? p.nameTa || p.label : p.label, value: p.count })), [fullData?.packages?.distribution, language]);
    const slotData = useMemo(() => (fullData?.bookings?.slots_utilization || []).map((s: any) => ({ name: s.label, value: s.count, color: s.label === 'Booked' ? '#D4AF37' : '#8B1D3D' })), [fullData?.bookings?.slots_utilization]);

    const matriStats: any = basicStats?.matrimony ?? fullData?.matrimony;
    const mandapamStats: any = basicStats?.mandapam ?? fullData?.bookings;
    const matriRevenue = basicStats?.revenue?.matrimony ?? fullData?.revenue?.highlights?.matrimony ?? 0;
    const mandapamRevenue = basicStats?.revenue?.mandapam ?? fullData?.revenue?.highlights?.bookings ?? 0;
    const statLoading = statsLoading && isLoading;

    return (
        <div className="w-full space-y-10 max-w-7xl mx-auto pb-12">
            <AnalyticsHeader activeTab={activeTab} onTabChange={setActiveTab} />
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-10 relative z-10 px-4 lg:px-0">
                    {activeTab === 'matrimony' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <GlassStatCard title={t('stats.totalRegistered')} value={matriStats?.total || 0} icon={<Users size={18} className="text-gold" />} loading={statLoading} />
                                <GlassStatCard title={t('stats.verifiedProfiles')} value={matriStats?.verified || 0} icon={<ShieldCheck size={18} className="text-gold" />} loading={statLoading} />
                                <GlassStatCard title={t('stats.premiumMembers')} value={matriStats?.premium || 0} icon={<TrendingUp size={18} className="text-gold" />} loading={statLoading} />
                                <GlassStatCard title={t('stats.totalRevenue')} value={formatCurrency(matriRevenue)} icon={<DollarSign size={18} className="text-gold" />} loading={statLoading} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 h-[400px]"><AreaChartCard title={t('revenue.title')} data={matriRevenueMonthly} gradientId="matriRevenueGradient" loading={isLoading} /></div>
                                <div className="lg:col-span-5 h-[400px]"><DonutChartCard title={t('gender.title')} subtitle={t('gender.subtitle')} data={genderData} colors={['#8B1D3D', '#D4AF37']} centerLabel={String(matriStats?.total || 0)} loading={isLoading} /></div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-6 h-[400px]"><FunnelBarCard title={t('funnel.title')} subtitle={t('funnel.subtitle')} data={matriFunnelData} loading={isLoading} /></div>
                                <div className="lg:col-span-6 h-[400px]"><HorizontalBarCard title={t('geo.title')} subtitle={t('geo.subtitle')} data={districtData} loading={isLoading} /></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <GlassStatCard title={t('stats.totalBookings')} value={mandapamStats?.total || 0} icon={<Calendar size={18} className="text-gold" />} loading={statLoading} />
                                <GlassStatCard title={t('stats.completedEvents')} value={mandapamStats?.completed || 0} icon={<ShieldCheck size={18} className="text-gold" />} loading={statLoading} />
                                <GlassStatCard title={t('stats.bookingSuccessRate')} value={mandapamStats?.total > 0 ? `${Math.round(((mandapamStats?.completed || 0) / mandapamStats?.total) * 100)}%` : '0%'} icon={<TrendingUp size={18} className="text-gold" />} loading={statLoading} />
                                <GlassStatCard title={t('stats.bookingRevenue')} value={formatCurrency(mandapamRevenue)} icon={<DollarSign size={18} className="text-gold" />} loading={statLoading} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 h-[400px]"><AreaChartCard title={t('revenue.title')} data={mandapamRevenueMonthly} gradientId="mandapamRevenueGradient" loading={isLoading} /></div>
                                <div className="lg:col-span-5 h-[400px]"><HorizontalBarCard title={t('mandapam.packagePopularity')} subtitle={t('mandapam.packageSubtitle')} data={packageData} loading={isLoading} /></div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 h-[400px]"><AreaChartCard title={t('mandapam.bookingTrend')} subtitle={t('mandapam.trendSubtitle')} data={bookingTrendMonthly} gradientId="bookingGradient" loading={isLoading} noHover /></div>
                                <div className="lg:col-span-5 h-[400px]"><ComparisonBarCard title={t('mandapam.slotUtilization')} subtitle={t('mandapam.capacityPlanning')} data={slotData} loading={isLoading} /></div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-12 h-[400px]"><FunnelBarCard title={t('mandapam.bookingFunnel')} subtitle={t('mandapam.funnelSubtitle')} data={bookingFunnelData} loading={isLoading} /></div>
                            </div>
                        </>
                    )}
                    <StatusAlert analyticsData={fullData} isLoading={isLoading} activeTab={activeTab} />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Analytics;
