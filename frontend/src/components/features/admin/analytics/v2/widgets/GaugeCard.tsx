import React from 'react';

interface Props {
  title: string; subtitle?: string; value: number; max?: number; label?: string;
  secondary?: { label: string; value: number }; loading?: boolean;
}

export const GaugeCard: React.FC<Props> = ({ title, subtitle, value, max = 100, label, secondary, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-40 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-28 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="flex justify-center py-8"><div className="size-32 rounded-full bg-rosewood/5" /></div>
      </div>
    );
  }
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const angle = (pct / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 65;
  const cx = 85, cy = 82;
  const sx = cx - r, sy = cy;
  const ex = cx - r * Math.cos(rad), ey = cy - r * Math.sin(rad);
  const largeArc = angle > 90 ? 1 : 0;
  const color = pct > 80 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981';

  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center justify-center gap-6 p-4">
        <div className="relative">
          <svg width="170" height="105" viewBox="0 0 170 110">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#F3F4F6" strokeWidth="12" strokeLinecap="round" />
            {pct > 0 && <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />}
            <text x={cx} y={cy - 3} textAnchor="middle" fill="#6B0028" fontSize="20" fontFamily="serif" fontWeight="bold">{Math.round(pct)}%</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#D4AF37" fontSize="9" fontWeight="bold" letterSpacing="2" >{label ?? 'Occupancy'}</text>
          </svg>
        </div>
        {secondary && (
          <div className="text-center border-l border-gold/10 pl-6">
            <p className="text-2xl font-serif font-bold text-rosewood">{secondary.value}%</p>
            <p className="text-[9px] font-black text-gold uppercase tracking-widest">{secondary.label}</p>
          </div>
        )}
      </div>
    </div>
  );
};
