import React from 'react';
import { motion } from 'framer-motion';
import type { MandapamAnalytics } from '@/types/analytics';
import { MetricsGrid } from '../widgets/MetricsGrid';
import { TrendComposedChart } from '../widgets/TrendComposedChart';
import { DonutCard } from '../widgets/DonutCard';
import { StackedBarCard } from '../widgets/StackedBarCard';
import { Calendar, DollarSign, CreditCard, Activity, BarChart3, TrendingUp } from 'lucide-react';

interface Props { data: MandapamAnalytics | null; loading: boolean }

const REVENUE_KEYS = [
  { key: 'standard', color: '#3B82F6', name: 'Standard' },
  { key: 'royal', color: '#D4AF37', name: 'Royal' },
  { key: 'grand', color: '#6B0028', name: 'Grand' },
  { key: 'addon', color: '#10B981', name: 'Add-ons' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const GlassCard: React.FC<{ title: string; subtitle?: string; icon?: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, subtitle, icon: Icon, children, className = '' }) => (
  <div className={`relative bg-white/10 backdrop-blur-2xl border-2 border-gold/30 rounded-xl overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-linear-to-br from-white/40 to-white/5 rounded-xl pointer-events-none" />
    <div className="absolute top-0 right-0 w-40 h-40 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
    <div className="relative z-10 flex flex-col">
      <div className="px-6 py-5 bg-linear-to-r from-ivory/80 via-gold-soft/10 to-ivory/80 backdrop-blur-xl border-b border-gold/10">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="size-9 rounded-xl bg-rosewood-gradient flex items-center justify-center shadow-md shrink-0">
              <Icon size={16} className="text-gold" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-serif font-black text-rosewood">{title}</h3>
            {subtitle && <p className="text-[9px] text-gold font-black uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export const MandapamSection: React.FC<Props> = ({ data, loading }) => {
  const o = data?.overview;
  const metrics = o ? [
    { label: 'Occupancy Rate', value: `${Math.round(o.occupancyRate)}%` },
    { label: 'Active Bookings', value: o.activeBookings },
    { label: 'Revenue MTD', value: `₹${(o.revenueMTD / 100000).toFixed(1)}L` },
    { label: 'Outstanding', value: `₹${(o.outstandingBalance / 100000).toFixed(1)}L` },
  ] : [];

  const wowMetrics = o ? [
    { label: 'Revenue WoW', value: `${o.revenueWoW >= 0 ? '+' : ''}${o.revenueWoW}%` },
    { label: 'Occupancy WoW', value: `${o.occupancyWoW >= 0 ? '+' : ''}${o.occupancyWoW}%` },
    { label: 'Bookings WoW', value: `${o.bookingWoW >= 0 ? '+' : ''}${o.bookingWoW}%` },
    { label: 'Outstanding WoW', value: `${o.outstandingWoW >= 0 ? '+' : ''}${o.outstandingWoW}%` },
  ] : [];

  const lifecycle = data?.bookingLifecycle ? [
    { name: 'Confirmed', value: data.bookingLifecycle.confirmed, color: '#3B82F6' },
    { name: 'In Progress', value: data.bookingLifecycle.eventInProgress, color: '#F59E0B' },
    { name: 'Settlement Pending', value: data.bookingLifecycle.settlementPending, color: '#EC4899' },
    { name: 'Completed', value: data.bookingLifecycle.completed, color: '#10B981' },
    { name: 'Cancelled', value: data.bookingLifecycle.cancelled, color: '#EF4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Overview KPIs */}
      <motion.div variants={fadeUp}>
        <MetricsGrid metrics={metrics} loading={loading} />
      </motion.div>

      {/* WoW Trends */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Week-over-Week Trends" subtitle="Changes compared to the previous week" icon={TrendingUp}>
          <MetricsGrid metrics={wowMetrics} loading={loading} />
        </GlassCard>
      </motion.div>

      {/* Booking & Revenue Trend */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Booking & Revenue Trend" subtitle="Monthly bookings with revenue overlay" icon={Activity}>
          <TrendComposedChart
            title=""
            data={data?.bookingTrend?.map(d => ({ ...d })) ?? []}
            series={[
              { key: 'bookings', type: 'bar', color: '#D4AF37', name: 'Bookings' },
              { key: 'revenue', type: 'line', color: '#8B1D3D', name: 'Revenue' },
            ]}
            xKey="month"
            loading={loading}
          />
        </GlassCard>
      </motion.div>

      {/* Lifecycle & Revenue Breakdown */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Lifecycle & Revenue Breakdown" subtitle="Booking status distribution and revenue by package tier" icon={BarChart3}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutCard
              title="Booking Lifecycle"
              subtitle="Current statuses"
              data={lifecycle}
              centerLabel={String(data?.bookingLifecycle ? Object.values(data.bookingLifecycle).reduce((a, b) => a + b, 0) : 0)}
              loading={loading}
            />
            <StackedBarCard
              title="Revenue by Package"
              subtitle="Monthly by tier"
              data={data?.revenueBreakdown ?? []}
              keys={REVENUE_KEYS}
              xKey="month"
              loading={loading}
            />
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};