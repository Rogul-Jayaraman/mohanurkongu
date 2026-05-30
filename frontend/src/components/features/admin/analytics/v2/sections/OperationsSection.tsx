import React from 'react';
import { motion } from 'framer-motion';
import type { OperationsAnalytics } from '@/types/analytics';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { MetricsGrid } from '../widgets/MetricsGrid';
import { TrendComposedChart } from '../widgets/TrendComposedChart';
import { DonutCard } from '../widgets/DonutCard';
import { StackedBarCard } from '../widgets/StackedBarCard';
import { VerificationTimeDistribution } from '../widgets/VerificationTimeDistribution';
import { ShieldCheck, BarChart3, Clock, AlertTriangle, Activity } from 'lucide-react';

interface Props { data: OperationsAnalytics | null; loading: boolean }

const QUEUE = [
  { key: 'incoming', color: '#3B82F6', name: 'Incoming' },
  { key: 'resolved', color: '#10B981', name: 'Resolved' },
  { key: 'pending', color: '#F59E0B', name: 'Pending' },
];
const REJECT = ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981'];
const AGING = ['#9CA3AF', '#EC4899', '#F59E0B'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const OperationsSection: React.FC<Props> = ({ data, loading }) => {
  const o = data?.overview;
  const metrics = o ? [
    { label: 'Queue Size', value: o.queueSize, change: 0, icon: Activity },
    { label: 'Avg TAT', value: `${Math.round(o.avgTAT)}h`, change: o.tatWoW, icon: Clock },
    { label: 'SLA Compliance', value: `${o.slaCompliance.toFixed(1)}%`, change: o.slaWoW, icon: ShieldCheck },
    { label: 'Approvals Today', value: o.approvalsToday, change: 0, icon: ShieldCheck },
  ] : [];

  const agingDonut = data?.queueAging?.map((d, i) => ({ name: d.label, value: d.count, color: AGING[i % AGING.length] })) ?? [];
  const rejectionDonut = data?.rejectionReasons?.map((d, i) => ({ name: d.reason, value: d.count, color: REJECT[i % REJECT.length] })) ?? [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <motion.div variants={fadeUp}><MetricsGrid metrics={metrics} loading={loading} /></motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Verification Queue" icon={Activity} subtitle="Daily incoming, resolved, pending" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <StackedBarCard title="Queue Trend" data={data?.queueTrend ?? []} keys={QUEUE} xKey="date" loading={loading} stacked />
          <VerificationTimeDistribution title="Time Distribution" subtitle="Time taken per verification" data={data?.verificationTimeDist?.map(d => ({ bucket: d.label, count: d.count })) ?? []} loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Approval & Queue Aging" icon={BarChart3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <TrendComposedChart title="Approval Trend" subtitle="Daily approval vs rejection" data={data?.approvalTrend ?? []} series={[
            { key: 'approved', type: 'bar', color: '#10B981', name: 'Approved' },
            { key: 'rejected', type: 'bar', color: '#EF4444', name: 'Rejected' },
            { key: 'approvalRate', type: 'line', color: '#3B82F6', name: 'Rate' },
          ]} xKey="date" loading={loading} />
          <DonutCard title="Queue Aging" subtitle="Pending items by age" data={agingDonut} centerLabel={String(data?.queueAging?.reduce((s, d) => s + d.count, 0) ?? 0)} loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Rejection Analysis" icon={AlertTriangle} subtitle="Why profiles get rejected" />
        <div className="mt-4">
          <DonutCard title="Rejection Reasons" data={rejectionDonut} centerLabel={String(data?.rejectionReasons?.reduce((s, d) => s + d.count, 0) ?? 0)} loading={loading} />
        </div>
      </motion.div>
    </motion.div>
  );
};
