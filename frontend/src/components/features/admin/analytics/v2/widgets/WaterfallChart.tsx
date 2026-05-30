import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { BarChart3 } from 'lucide-react';

interface DataItem { label: string; value: number; isTotal?: boolean }

interface Props { title: string; subtitle?: string; data: DataItem[]; loading?: boolean; height?: number }

export const WaterfallChart: React.FC<Props> = ({ title, subtitle, data, loading, height = 280 }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-44 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-28 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[240px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  let running = 0;
  const chartData = data.map((d, i) => {
    if (d.isTotal) return { ...d, base: 0, display: d.value };
    const b = running; running += d.value;
    return { ...d, base: b, display: Math.abs(d.value) };
  });
  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {data.length === 0 ? (
        <div className="p-6"><EmptyState message="No data yet" icon={BarChart3} variant="dashed" /></div>
      ) : (
        <div className="p-4"><div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="bg-white/95 border border-gold/20 rounded-xl shadow-lg px-4 py-3 text-xs"><p className="font-serif font-bold text-rosewood">{d.label}</p><p className="text-slate-600">{d.isTotal ? `Total: ${d.display.toLocaleString()}` : `${d.value > 0 ? '+' : ''}${d.value.toLocaleString()}`}</p></div>;
              }} />
              <Bar dataKey="display" stackId="a" barSize={32} radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.isTotal ? '#3B82F6' : d.value >= 0 ? '#10B981' : '#EF4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div></div>
      )}
    </div>
  );
};
