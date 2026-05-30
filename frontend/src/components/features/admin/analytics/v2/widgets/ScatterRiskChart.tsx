import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { ScatterChart as ScatterIcon } from 'lucide-react';

interface DataItem { label: string; x: number; y: number; risk: 'low' | 'medium' | 'high'; value?: number }

interface Props { title: string; subtitle?: string; data: DataItem[]; xLabel?: string; yLabel?: string; loading?: boolean }

const RISK: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

export const ScatterRiskChart: React.FC<Props> = ({ title, subtitle, data, xLabel, yLabel, loading }) => {
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
        <div className="p-6"><EmptyState message="No risk data" icon={ScatterIcon} variant="dashed" /></div>
      ) : (
        <>
          <div className="p-4"><div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: xLabel ?? '', position: 'bottom', fontSize: 9, fill: '#9CA3AF', dy: 6 }} />
                <YAxis dataKey="y" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: yLabel ?? '', angle: -90, position: 'left', fontSize: 9, fill: '#9CA3AF', dx: -2 }} />
                <ReferenceLine y={0} stroke="#E5E7EB" />
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return <div className="bg-white/95 border border-gold/20 rounded-xl shadow-lg px-4 py-3 text-xs"><p className="font-serif font-bold text-rosewood">{d.label}</p><p className="text-slate-600">{xLabel ?? 'X'}: {d.x.toLocaleString()}</p><p className="text-slate-600">{yLabel ?? 'Y'}: {d.y.toLocaleString()}</p><p className="mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK[d.risk] }} /><span className="capitalize font-bold">{d.risk} risk</span></p></div>;
                }} />
                <Scatter data={data} shape="circle">
                  {data.map((d, i) => <Cell key={i} fill={RISK[d.risk]} fillOpacity={0.6} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div></div>
          <div className="flex items-center gap-4 px-6 pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High</span>
          </div>
        </>
      )}
    </div>
  );
};
