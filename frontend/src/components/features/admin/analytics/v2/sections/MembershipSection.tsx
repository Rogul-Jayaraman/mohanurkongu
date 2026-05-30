import React from 'react';
import { motion } from 'framer-motion';
import type { MembershipAnalytics } from '@/types/analytics';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { MetricsGrid } from '../widgets/MetricsGrid';
import { TrendComposedChart } from '../widgets/TrendComposedChart';
import { DonutCard } from '../widgets/DonutCard';
import { ScatterRiskChart } from '../widgets/ScatterRiskChart';
import { ExpiryForecastChart } from '../widgets/ExpiryForecastChart';
import { TrendingUp, BarChart3, AlertTriangle, CalendarClock } from 'lucide-react';

interface Props { data: MembershipAnalytics | null; loading: boolean }

const PLAN = ['#9CA3AF', '#A8A29E', '#F59E0B', '#D4AF37', '#6B0028', '#10B981'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const MembershipSection: React.FC<Props> = ({ data, loading }) => {
  const o = data?.overview;
  const metrics = o ? [
    { label: 'MRR', value: `₹${(o.mrr / 1000).toFixed(0)}K`, change: o.mrrWoW, icon: TrendingUp },
    { label: 'ARR', value: `₹${(o.arr / 100000).toFixed(1)}L`, change: o.arrWoW, icon: TrendingUp },
    { label: 'Avg Revenue/User', value: `₹${Math.round(o.avgRevenuePerUser)}`, change: o.arpuWoW, icon: TrendingUp },
    { label: 'Churn Rate', value: `${o.churnRate.toFixed(1)}%`, change: o.churnWoW, icon: AlertTriangle },
  ] : [];

  const planDonut = data?.planDistribution?.map((d, i) => ({ name: d.plan, value: d.count, color: PLAN[i % PLAN.length] })) ?? [];

  const churnData = (data?.churnRiskScatter?.map(d => {
    const risk: 'high' | 'medium' | 'low' = d.daysToExpiry < 7 ? 'high' : d.daysToExpiry < 30 ? 'medium' : 'low';
    return { label: d.plan, x: d.daysSinceLogin, y: d.daysToExpiry, risk, value: d.value };
  }) ?? []) as { label: string; x: number; y: number; risk: 'high' | 'medium' | 'low'; value: number }[];

  const expiryForecast = data?.expiryForecast?.map(d => ({
    month: d.bucket,
    expiring: (d.bronze ?? 0) + (d.silver ?? 0) + (d.gold ?? 0) + (d.platinum ?? 0),
    renewed: 0, atRisk: 0,
  })) ?? [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <motion.div variants={fadeUp}><MetricsGrid metrics={metrics} loading={loading} /></motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="MRR Trend" icon={TrendingUp} subtitle="Monthly recurring revenue" />
        <div className="mt-4">
          <TrendComposedChart title="" data={data?.mrrTrend?.map(d => ({ ...d })) ?? []} series={[
            { key: 'mrr', type: 'bar', color: '#10B981', name: 'MRR' },
          ]} xKey="month" loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Plan Distribution & Churn Risk" icon={BarChart3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <DonutCard title="Plan Distribution" subtitle="Current active plans" data={planDonut} centerLabel={String(data?.planDistribution?.reduce((s, d) => s + d.count, 0) ?? 0)} loading={loading} />
          <ScatterRiskChart title="Churn Risk Analysis" subtitle="Days since login vs days to expiry" data={churnData} xLabel="Days Since Login" yLabel="Days to Expiry" loading={loading} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <SectionHeader title="Expiry Forecast" icon={CalendarClock} subtitle="Upcoming subscription expirations" />
        <div className="mt-4">
          <ExpiryForecastChart title="" data={expiryForecast} loading={loading} />
        </div>
      </motion.div>
    </motion.div>
  );
};
