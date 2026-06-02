import React from 'react';
import { motion } from 'framer-motion';
import type { ManamaalaiAnalytics } from '@/types/analytics';
import { MetricsGrid } from '../widgets/MetricsGrid';
import { TrendComposedChart } from '../widgets/TrendComposedChart';
import { DonutCard } from '../widgets/DonutCard';
import { RadarComparison } from '../widgets/RadarComparison';
import { StackedBarCard } from '../widgets/StackedBarCard';
import { GroupedBarCard } from '../widgets/GroupedBarCard';
import { FunnelChart } from '../widgets/FunnelChart';
import { RenewalForecastChart } from '../widgets/RenewalForecastChart';
import { BarChart3, DollarSign, Activity, Users, Layers, TrendingUp } from 'lucide-react';

interface Props { data: ManamaalaiAnalytics | null; loading: boolean }

const STATUS_KEYS = [
  { key: 'draft', color: '#9CA3AF', name: 'Draft' },
  { key: 'pending', color: '#F59E0B', name: 'Pending' },
  { key: 'active', color: '#10B981', name: 'Active' },
  { key: 'rejected', color: '#EF4444', name: 'Rejected' },
  { key: 'archived', color: '#6B7280', name: 'Archived' },
];
const REVENUE_DONUT = ['#2563EB', '#D4AF37', '#8B5CF6'];

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

export const ManamaalaiSection: React.FC<Props> = ({ data, loading }) => {
  const o = data?.overview;
  const rev = data?.membershipRevenue;

  const overviewMetrics = o ? [
    { label: 'Active Profiles', value: o.activeProfiles },
    { label: 'Pending Verifications', value: o.pendingVerifications },
    { label: 'New Registrations (7d)', value: o.newRegistrations7d },
    { label: 'Active Memberships', value: o.activeMemberships },
  ] : [];

  const revenueMetrics = rev ? [
    { label: 'MRR', value: `₹${(rev.mrr / 1000).toFixed(1)}K` },
    { label: 'ARR', value: `₹${(rev.arr / 100000).toFixed(1)}L` },
    { label: 'Avg Revenue/User', value: `₹${rev.arpu}` },
    { label: 'Churn Rate', value: `${rev.churnRate}%` },
  ] : [];

  const membershipDonut = data?.membershipPlanDistribution?.map((d, i) => ({
    name: d.plan,
    value: d.count,
    color: REVENUE_DONUT[i % REVENUE_DONUT.length],
  })) ?? [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Overview KPIs */}
      <motion.div variants={fadeUp}>
        <MetricsGrid metrics={overviewMetrics} loading={loading} />
      </motion.div>

      {/* Membership Revenue */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Membership Revenue" subtitle="MRR, ARR, ARPU & Churn rate overview" icon={DollarSign}>
          <MetricsGrid metrics={revenueMetrics} loading={loading} />
        </GlassCard>
      </motion.div>

      {/* Profile Growth */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Profile Growth" subtitle="Daily new profile registrations" icon={Activity}>
          <TrendComposedChart
            title=""
            data={data?.profileGrowth ?? []}
            series={[{ key: 'count', type: 'bar', color: '#D4AF37', name: 'Profiles' }]}
            xKey="date"
            loading={loading}
          />
        </GlassCard>
      </motion.div>

      {/* Demographics & Plan Distribution */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Demographics & Plans" subtitle="Profile traits and membership breakdown" icon={BarChart3}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RadarComparison
              title="Demographics Radar"
              subtitle="Male vs Female by trait"
              labels={data?.demographicsRadar?.labels ?? []}
              male={data?.demographicsRadar?.male ?? []}
              female={data?.demographicsRadar?.female ?? []}
              loading={loading}
            />
            <DonutCard
              title="Plan Distribution"
              subtitle="Silver, Gold, Platinum"
              data={membershipDonut}
              centerLabel={String(data?.membershipPlanDistribution?.reduce((s, p) => s + p.count, 0) ?? 0)}
              loading={loading}
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Age-Gender Matrix */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Age-Gender Matrix" subtitle="Profile distribution by age bucket and gender" icon={Users}>
          <GroupedBarCard
            title=""
            data={data?.ageGenderMatrix ?? []}
            keys={[
              { key: 'male', color: '#D4AF37', name: 'Male' },
              { key: 'female', color: '#8B1D3D', name: 'Female' },
            ]}
            xKey="bucket"
            loading={loading}
          />
        </GlassCard>
      </motion.div>

      {/* Membership Conversion Funnel */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Membership Conversion Funnel" subtitle="From registration to active membership" icon={Layers}>
          <FunnelChart title="" subtitle="" data={data?.membershipFunnel ?? []} loading={loading} />
        </GlassCard>
      </motion.div>

      {/* Profile Status Over Time */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Profile Status Over Time" subtitle="Daily breakdown by verification status" icon={Activity}>
          <StackedBarCard
            title=""
            data={data?.profileStatusStack ?? []}
            keys={STATUS_KEYS}
            xKey="date"
            loading={loading}
            height={320}
            stacked
          />
        </GlassCard>
      </motion.div>

      {/* Renewal Forecast */}
      <motion.div variants={fadeUp}>
        <GlassCard title="Renewal Forecast" subtitle="Expiring subscriptions by plan" icon={TrendingUp}>
          <RenewalForecastChart title="" subtitle="" data={data?.renewalForecast ?? []} loading={loading} />
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};