import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { CalendarClock } from 'lucide-react';

interface DataItem { month: string; expiring: number; renewed: number; atRisk: number }

interface Props { title: string; subtitle?: string; data: DataItem[]; loading?: boolean }

export const ExpiryForecastChart: React.FC<Props> = ({ title, subtitle, data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-48 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-32 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[240px] bg-ivory-tint/30 m-4 rounded-lg" />
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
        <div className="p-6"><EmptyState message="No forecast data" icon={CalendarClock} variant="dashed" /></div>
      ) : (
        <div className="p-4"><div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return <div className="bg-white/95 border border-gold/20 rounded-xl shadow-lg px-4 py-3 text-xs"><p className="font-serif font-bold text-rosewood mb-1">{label}</p>{payload.map((p: any, i: number) => <p key={i} className="text-slate-600" style={{ color: p.color }}>{p.name}: <span className="font-bold">{Number(p.value).toLocaleString()}</span></p>)}</div>;
              }} />
              <Bar dataKey="expiring" name="Expiring" fill="#F59E0B" radius={[2, 2, 0, 0]} barSize={18} />
              <Bar dataKey="renewed" name="Renewed" fill="#10B981" radius={[2, 2, 0, 0]} barSize={18} />
              <ReferenceLine y={0} stroke="#E5E7EB" />
            </BarChart>
          </ResponsiveContainer>
        </div></div>
      )}
    </div>
  );
};
