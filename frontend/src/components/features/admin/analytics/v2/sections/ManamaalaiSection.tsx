import React from 'react';
import { motion } from 'framer-motion';
import type { ManamaalaiAnalytics } from '@/types/analytics';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { MetricsGrid } from '../widgets/MetricsGrid';
import { TrendComposedChart } from '../widgets/TrendComposedChart';
import { DonutCard } from '../widgets/DonutCard';
import { RadarComparison } from '../widgets/RadarComparison';
import { CalendarHeatmap } from '../widgets/CalendarHeatmap';
import { TreemapChart } from '../widgets/TreemapChart';
import { StackedBarCard } from '../widgets/StackedBarCard';
import { GroupedBarCard } from '../widgets/GroupedBarCard';
import { Users, ShieldCheck, TrendingUp, BarChart3, Activity, LayoutGrid, Layers } from 'lucide-react';

interface Props { data: ManamaalaiAnalytics | null; loading: boolean }

const DONUT = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
const STATUS_KEYS = [
  { key: 'draft', color: '#9CA3AF', name: 'Draft' },
  { key: 'pending', color: '#F59E0B', name: 'Pending' },
  { key: 'active', color: '#10B981', name: 'Active' },
  { key: 'rejected', color: '#EF4444', name: 'Rejected' },
  { key: 'archived', color: '#6B7280', name: 'Archived' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const ManamaalaiSection: React.FC<Props> = ({ data, loading }) => {
  const o = data?.overview;
  const metrics = o ? [
    { label: 'Active Profiles', value: o.activeProfiles, change: o.activeProfilesWoW, icon: Users },
    { label: 'Pending Verifications', value: o.pendingVerifications, change: o.pendingVerificationsWoW, icon: ShieldCheck },
    { label: 'New Registrations (7d)', value: o.newRegistrations7d, change: o.newRegistrationsWoW, icon: TrendingUp },
    { label: 'Active Memberships', value: o.activeMemberships, change: o.activeMembershipsWoW, icon: Users },
  ] : [];

  const membershipDonut = data?.membershipDistribution?.map((d, i) => ({ name: d.plan, value: d.count, color: DONUT[i % DONUT.length] })) ?? [];
  const dem = data?.demographicsRadar;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <motion.div variants={fadeUp}><MetricsGrid metrics={metrics} loading={loading} /></motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Profile Growth" icon={Activity} subtitle="Daily registrations with 7-day moving average" />
        <div className="mt-4">
          <TrendComposedChart title="" data={data?.profileGrowth ?? []} series={[
            { key: 'count', type: 'bar', color: '#2563EB', name: 'Profiles' },
            { key: 'movingAvg', type: 'line', color: '#D4AF37', name: 'Moving Avg' },
          ]} xKey="date" loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Membership & Demographics" icon={BarChart3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <DonutCard title="Membership Distribution" subtitle="Current plan breakdown" data={membershipDonut} centerLabel={String(o?.activeMemberships ?? 0)} loading={loading} />
          {dem ? <RadarComparison title="Demographics Radar" subtitle="Gender distribution by trait" labels={dem.labels} male={dem.male} female={dem.female} loading={loading} />
            : <div className="bg-white border border-gold/20 rounded-xl shadow-sm flex items-center justify-center h-[340px] text-slate-400 text-sm italic">No demographic data</div>}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Age-Gender Matrix" icon={Users} subtitle="Profile distribution by age bucket" />
        <div className="mt-4">
          <GroupedBarCard title="" data={data?.ageGenderMatrix ?? []} keys={[
            { key: 'male', color: '#2563EB', name: 'Male' },
            { key: 'female', color: '#EC4899', name: 'Female' },
          ]} xKey="bucket" loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Activity & Communities" icon={LayoutGrid} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <CalendarHeatmap title="Activity Calendar" subtitle="Daily activity (12 weeks)" data={data?.activityCalendar ?? []} loading={loading} type="activity" />
          <TreemapChart title="Community Distribution" subtitle="Profiles by community" data={data?.communityTreemap ?? []} loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Profile Status Over Time" icon={Layers} subtitle="Daily breakdown by status" />
        <div className="mt-4">
          <StackedBarCard title="" data={data?.profileStatusStack ?? []} keys={STATUS_KEYS} xKey="date" loading={loading} height={320} stacked />
        </div>
      </motion.div>
    </motion.div>
  );
};
