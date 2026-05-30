import React from 'react';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Calendar } from 'lucide-react';

interface DayData { date: string; count: number; status?: string }

interface Props {
  title: string; subtitle?: string; data: DayData[]; loading?: boolean; type?: 'activity' | 'occupancy';
}

const INTENSITY = ['bg-rosewood/10', 'bg-rosewood/25', 'bg-rosewood/45', 'bg-rosewood/70', 'bg-rosewood'];

function getColor(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-ivory-tint';
  const r = count / max;
  return r > 0.75 ? INTENSITY[4] : r > 0.5 ? INTENSITY[3] : r > 0.25 ? INTENSITY[2] : INTENSITY[1];
}

const OCCUPANCY: Record<string, string> = { AVAILABLE: 'bg-emerald-300', PARTIALLY_BOOKED: 'bg-gold/60', FULLY_BOOKED: 'bg-rosewood', BLOCKED: 'bg-slate-300' };

export const CalendarHeatmap: React.FC<Props> = ({ title, subtitle, data, loading, type = 'activity' }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-48 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-32 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[180px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  const maxCount = type === 'activity' ? Math.max(...data.map(d => d.count), 1) : 1;
  const dataByDate = new Map(data.map(d => [d.date, d]));
  const weeks: { date: string; day: number }[][] = [];
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay() - 83);
  let cw: { date: string; day: number }[] = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    cw.push({ date: d.toISOString().slice(0, 10), day: d.getDay() });
    if (d.getDay() === 6 || i === 83) { weeks.push(cw); cw = []; }
  }
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {data.length === 0 ? (
        <div className="p-6"><EmptyState message="No calendar data" icon={Calendar} variant="dashed" /></div>
      ) : (
        <div className="p-5 overflow-x-auto">
          <div className="flex gap-[3px] min-w-[600px]">
            <div className="flex flex-col gap-[3px] pr-2 pt-5">{days.map(d => <div key={d} className="text-[9px] font-bold text-slate-400 uppercase h-3.5 leading-3.5">{d}</div>)}</div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  const dd = dataByDate.get(day.date);
                  return (
                    <div key={di} title={type === 'activity' ? `${day.date}: ${dd?.count ?? 0}` : `${day.date}: ${dd?.status ?? 'available'}`}
                      className={`w-[13px] h-[13px] rounded-sm ${type === 'occupancy' ? OCCUPANCY[dd?.status ?? 'AVAILABLE'] : getColor(dd?.count ?? 0, maxCount)}`} />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Less</span>
            {type === 'activity' ? INTENSITY.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />) : (
              <><div className="w-3 h-3 rounded-sm bg-emerald-300" /><span>Free</span><div className="w-3 h-3 rounded-sm bg-gold/60" /><span>Partial</span><div className="w-3 h-3 rounded-sm bg-rosewood" /><span>Booked</span></>
            )}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
};
