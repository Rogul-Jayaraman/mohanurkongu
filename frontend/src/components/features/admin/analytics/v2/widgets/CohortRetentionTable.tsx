import React from 'react';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Table } from 'lucide-react';

interface CohortRow { label: string; size: number; periods: { rate: number; count: number }[] }

interface Props { title: string; subtitle?: string; data: CohortRow[]; periodLabel?: string; loading?: boolean }

export const CohortRetentionTable: React.FC<Props> = ({ title, subtitle, data, periodLabel = 'Month', loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-52 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-36 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[180px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  const maxP = Math.max(...data.map(r => r.periods.length), 0);
  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {data.length === 0 ? (
        <div className="p-6"><EmptyState message="No cohort data" icon={Table} variant="dashed" /></div>
      ) : (
        <div className="overflow-x-auto p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-gold/10">
                <th className="text-left font-black uppercase tracking-wider py-2 pr-4 sticky left-0 bg-white">{periodLabel}</th>
                <th className="text-right font-black uppercase tracking-wider py-2 px-2">Size</th>
                {Array.from({ length: maxP }, (_, i) => <th key={i} className="text-center font-black uppercase tracking-wider py-2 px-2">{periodLabel} {i + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} className="border-b border-gold/5 hover:bg-ivory-tint/50">
                  <td className="font-serif font-bold text-rosewood py-2.5 pr-4 sticky left-0 bg-white">{row.label}</td>
                  <td className="text-right text-slate-600 py-2.5 px-2 font-bold">{row.size.toLocaleString()}</td>
                  {row.periods.map((p, pi) => {
                    const pct = Math.round(p.rate * 100);
                    const bg = pct > 70 ? 'bg-emerald-100 text-emerald-800' : pct > 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
                    return <td key={pi} className="text-center py-2.5 px-2"><span className={`inline-block px-1.5 py-0.5 rounded font-black text-[10px] ${bg}`}>{pct}%</span><span className="text-slate-400 ml-1">({p.count})</span></td>;
                  })}
                  {Array.from({ length: maxP - row.periods.length }, (_, i) => <td key={`e-${i}`} className="text-center py-2.5 px-2 text-slate-300">–</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
