import React from 'react';
import { motion } from 'framer-motion';
import type { MandapamAnalytics } from '@/types/analytics';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { MetricsGrid } from '../widgets/MetricsGrid';
import { TrendComposedChart } from '../widgets/TrendComposedChart';
import { DonutCard } from '../widgets/DonutCard';
import { CalendarHeatmap } from '../widgets/CalendarHeatmap';
import { TreemapChart } from '../widgets/TreemapChart';
import { StackedBarCard } from '../widgets/StackedBarCard';
import { GaugeCard } from '../widgets/GaugeCard';
import { Calendar, DollarSign, CreditCard, Activity, BarChart3 } from 'lucide-react';

interface Props { data: MandapamAnalytics | null; loading: boolean }

const REVENUE_KEYS = [
  { key: 'standard', color: '#3B82F6', name: 'Standard' },
  { key: 'royal', color: '#D4AF37', name: 'Royal' },
  { key: 'grand', color: '#6B0028', name: 'Grand' },
  { key: 'addon', color: '#10B981', name: 'Add-ons' },
];
const PAYMENT = ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const MandapamSection: React.FC<Props> = ({ data, loading }) => {
  const o = data?.overview;
  const metrics = o ? [
    { label: 'Occupancy Rate', value: `${Math.round(o.occupancyRate)}%`, change: o.occupancyWoW, icon: Calendar },
    { label: 'Active Bookings', value: o.activeBookings, change: o.bookingWoW, icon: Calendar },
    { label: 'Revenue MTD', value: `₹${(o.revenueMTD / 100000).toFixed(1)}L`, change: o.revenueWoW, icon: DollarSign },
    { label: 'Outstanding', value: `₹${(o.outstandingBalance / 100000).toFixed(1)}L`, change: o.outstandingWoW, icon: CreditCard },
  ] : [];

  const lifecycle = data?.bookingLifecycle ? [
    { name: 'Confirmed', value: data.bookingLifecycle.confirmed, color: '#3B82F6' },
    { name: 'In Progress', value: data.bookingLifecycle.eventInProgress, color: '#F59E0B' },
    { name: 'Settlement Pending', value: data.bookingLifecycle.settlementPending, color: '#EC4899' },
    { name: 'Completed', value: data.bookingLifecycle.completed, color: '#10B981' },
    { name: 'Cancelled', value: data.bookingLifecycle.cancelled, color: '#EF4444' },
  ].filter(d => d.value > 0) : [];

  const paymentDonut = data?.paymentDistribution?.map((d, i) => ({ name: d.method, value: d.count, color: PAYMENT[i % PAYMENT.length] })) ?? [];
  const addonTreemap = data?.addonPerformance?.map(d => ({ name: d.name, value: d.revenue })) ?? [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <motion.div variants={fadeUp}><MetricsGrid metrics={metrics} loading={loading} /></motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Booking & Revenue Trend" icon={Activity} subtitle="Monthly bookings with revenue overlay" />
        <div className="mt-4">
          <TrendComposedChart title="" data={data?.bookingTrend?.map(d => ({ ...d })) ?? []} series={[
            { key: 'bookings', type: 'bar', color: '#3B82F6', name: 'Bookings' },
            { key: 'revenue', type: 'line', color: '#D4AF37', name: 'Revenue' },
          ]} xKey="month" loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Lifecycle & Revenue Breakdown" icon={BarChart3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <DonutCard title="Booking Lifecycle" subtitle="Current statuses" data={lifecycle} centerLabel={String(data?.bookingLifecycle ? Object.values(data.bookingLifecycle).reduce((a, b) => a + b, 0) : 0)} loading={loading} />
          <StackedBarCard title="Revenue by Package" subtitle="Monthly by tier" data={data?.revenueBreakdown ?? []} keys={REVENUE_KEYS} xKey="month" loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Occupancy & Payments" icon={Calendar} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <GaugeCard title="Occupancy Gauge" subtitle="Current vs forecast" value={data?.occupancyGauge?.current ?? 0} max={100} label="Current" secondary={data?.occupancyGauge ? { label: 'Forecast', value: data.occupancyGauge.forecast } : undefined} loading={loading} />
            <CalendarHeatmap title="Occupancy Calendar" subtitle="Next 30 days" data={data?.occupancyGauge?.next30Days?.map(d => ({ date: d.date, count: d.status === 'AVAILABLE' ? 0 : 1, status: d.status })) ?? []} loading={loading} type="occupancy" />
          </div>
          <div className="space-y-6">
            <DonutCard title="Payment Distribution" subtitle="By method" data={paymentDonut} centerLabel={String(data?.paymentDistribution?.reduce((s, d) => s + d.count, 0) ?? 0)} loading={loading} />
            <TreemapChart title="Add-on Performance" subtitle="Revenue from add-ons" data={addonTreemap} loading={loading} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
