import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { PieChart as PieIcon } from 'lucide-react';

interface DataItem { name: string; value: number; color: string }

interface Props {
  title: string;
  subtitle?: string;
  data: DataItem[];
  centerLabel?: string;
  loading?: boolean;
  height?: number;
}

export const DonutCard: React.FC<Props> = React.memo(({ title, subtitle, data, centerLabel, loading, height = 280 }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10">
          <div className="h-4 w-40 bg-rosewood/10 rounded" />
          {subtitle && <div className="h-3 w-28 bg-rosewood/5 rounded mt-1.5" />}
        </div>
        <div className="flex justify-center py-10"><div className="size-48 bg-rosewood/5 rounded-full" /></div>
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.value, 0);
  const isEmpty = data.length === 0 || total === 0;
  if (isEmpty) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gold/10">
          <h3 className="font-serif font-bold text-rosewood">{title}</h3>
          {subtitle && <p className="text-xs text-dark-brown/60 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-6"><EmptyState message="No distribution data" icon={PieIcon} variant="dashed" /></div>
      </div>
    );
  }
  const pct = data.map(d => ({ ...d, percent: Math.round((d.value / total) * 100) }));
  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-xs text-dark-brown/60 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-center p-5" style={{ height }}>
        <div className="relative" style={{ height: height - 60, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pct} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={3} dataKey="value" stroke="none">
                {pct.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="bg-white/95 border border-gold/20 rounded-xl shadow-lg px-4 py-3 text-xs"><p className="font-serif font-bold text-rosewood">{d.name}</p><p className="text-slate-600">{d.value.toLocaleString()} ({d.percent}%)</p></div>;
              }} />
            </PieChart>
          </ResponsiveContainer>
          {centerLabel && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-serif font-bold text-rosewood">{centerLabel}</span>
              <span className="text-xs text-dark-brown/60">Total</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-2">
          {pct.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-xs font-medium text-slate-500">{d.name} <span className="text-gold font-semibold">({d.percent}%)</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

DonutCard.displayName = 'DonutCard';
