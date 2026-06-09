import React from 'react';
import { StatCard } from '@/components/ui/cards/StatCard';
import { Users, ShieldCheck, TrendingUp, DollarSign, Calendar, Clock, AlertTriangle, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  inverse?: boolean;
  icon?: LucideIcon;
}

interface Props {
  metrics: Metric[];
  loading?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  'Active Profiles': Users,
  'Pending Verifications': ShieldCheck,
  'New Registrations': TrendingUp,
  'Active Memberships': Users,
  'Occupancy Rate': Calendar,
  'Active Bookings': Calendar,
  'Monthly Revenue': DollarSign,
  'Annual Revenue': TrendingUp,
  'Per Member Revenue': DollarSign,
  'Drop-off Rate': AlertTriangle,
  'Outstanding': DollarSign,
  'Queue Size': Activity,
  'Response Time': Clock,
  'Service Level': ShieldCheck,
  'Approvals Today': ShieldCheck,
};

export const MetricsGrid: React.FC<Props> = React.memo(({ metrics, loading }) => {
  if (metrics.length === 0 && !loading) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {metrics.map((m, i) => (
        <StatCard
          key={m.label}
          label={m.label}
          value={loading ? '—' : m.value}
          icon={m.icon ?? ICON_MAP[m.label] ?? Activity}
          isLoading={loading}
          delay={i * 0.05}
        />
      ))}
    </div>
  );
});

MetricsGrid.displayName = 'MetricsGrid';
