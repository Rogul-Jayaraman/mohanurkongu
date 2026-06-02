import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { BarChart3 } from 'lucide-react';

interface DataPoint { [key: string]: string | number }

interface Series {
  key: string;
  type: 'bar' | 'line';
  color: string;
  name: string;
  yAxisId?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  series: Series[];
  xKey: string;
  loading?: boolean;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 border border-gold/20 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-serif font-bold text-rosewood mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-slate-600" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export const TrendComposedChart: React.FC<Props> = React.memo(({ title, subtitle, data, series, xKey, loading, height = 300 }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10">
          <div className="h-4 w-44 bg-rosewood/10 rounded" />
          {subtitle && <div className="h-3 w-28 bg-rosewood/5 rounded mt-1.5" />}
        </div>
        <div className="h-[260px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {data.length === 0 ? (
        <div className="p-6"><EmptyState message="No trend data yet" icon={BarChart3} variant="dashed" /></div>
      ) : (
        <div className="p-4">
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {series.map(s =>
                  s.type === 'bar'
                    ? <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.name} radius={[4, 4, 0, 0]} barSize={20} />
                    : <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} name={s.name} strokeWidth={2.5} dot={{ r: 3, fill: s.color, strokeWidth: 2, stroke: '#fff' }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
});

TrendComposedChart.displayName = 'TrendComposedChart';
