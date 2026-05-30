import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Clock } from 'lucide-react';

interface Props { title: string; subtitle?: string; data: { bucket: string; count: number; fill?: string }[]; loading?: boolean }

const COLORS = ['#D4AF37', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const VerificationTimeDistribution: React.FC<Props> = ({ title, subtitle, data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-52 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-36 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[200px] bg-ivory-tint/30 m-4 rounded-lg" />
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
        <div className="p-6"><EmptyState message="No verification data" icon={Clock} variant="dashed" /></div>
      ) : (
        <div className="p-4"><div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="bg-white/95 border border-gold/20 rounded-xl shadow-lg px-4 py-3 text-xs"><p className="font-serif font-bold text-rosewood">{d.bucket}</p><p className="text-slate-600">{d.count} verification{d.count !== 1 ? 's' : ''}</p></div>;
              }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                {data.map((d, i) => <Cell key={i} fill={d.fill ?? COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div></div>
      )}
    </div>
  );
};
