import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Radar as RadarIcon } from 'lucide-react';

interface Props {
  title: string; subtitle?: string; labels: string[]; male: number[]; female: number[]; loading?: boolean;
}

export const RadarComparison: React.FC<Props> = ({ title, subtitle, labels, male, female, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-44 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-28 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[260px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  const data = labels.map((l, i) => ({ label: l, Male: male[i] ?? 0, Female: female[i] ?? 0 }));
  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {data.length === 0 ? (
        <div className="p-6"><EmptyState message="No demographic data" icon={RadarIcon} variant="dashed" /></div>
      ) : (
        <div className="p-4" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
              <Radar name="Male" dataKey="Male" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} strokeWidth={2} />
              <Radar name="Female" dataKey="Female" stroke="#EC4899" fill="#EC4899" fillOpacity={0.12} strokeWidth={2} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
