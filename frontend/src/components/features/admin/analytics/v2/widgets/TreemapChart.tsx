import React from 'react';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { LayoutGrid } from 'lucide-react';

interface DataItem { name: string; value: number; color?: string }

interface Props { title: string; subtitle?: string; data: DataItem[]; loading?: boolean }

const COLORS = ['#6B0028', '#D4AF37', '#819683', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export const TreemapChart: React.FC<Props> = ({ title, subtitle, data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-48 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-32 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[260px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 12);
  const withColor = sorted.map((d, i) => ({ ...d, color: d.color ?? COLORS[i % COLORS.length] }));
  const layout = doLayout(withColor, 500, 300, total || 1);

  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {data.length === 0 ? (
        <div className="p-6"><EmptyState message="No data yet" icon={LayoutGrid} variant="dashed" /></div>
      ) : (
        <div className="p-3">
          <svg viewBox="0 0 500 300" className="w-full" style={{ height: 300 }}>
            {layout.map((item, i) => (
              <g key={i}>
                <rect x={item.x} y={item.y} width={Math.max(item.w, 1)} height={Math.max(item.h, 1)} fill={item.color} rx={3} ry={3} opacity={0.85} />
                {item.w > 50 && item.h > 25 && (
                  <>
                    <text x={item.x + item.w / 2} y={item.y + item.h / 2 - 4} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>
                      {item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name}
                    </text>
                    <text x={item.x + item.w / 2} y={item.y + item.h / 2 + 12} textAnchor="middle" fill="white" fontSize={9} opacity={0.8}>
                      {item.value.toLocaleString()}
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

function doLayout(items: any[], w: number, h: number, sum: number): any[] {
  if (items.length === 0) return [];
  const scale = (w * h) / sum;
  const result: any[] = [];
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const totalArea = sorted.reduce((s, it) => s + it.value * scale, 0);
  let x = 0, y = 0, rw = w, rh = h;
  const horizontal = w >= h;
  let row: any[] = [];
  let rowArea = 0;
  for (const item of sorted) {
    const a = item.value * scale;
    row.push({ ...item, a });
    rowArea += a;
    if (row.length > 1 && worst(row, horizontal ? rh : rw, horizontal ? rw : rh) > Math.max(999, 0)) {
      const last = row.pop()!;
      rowArea -= last.a;
      place(result, row, rowArea, x, y, rw, rh, horizontal);
      if (horizontal) { x += rw * (rowArea / totalArea); rw -= rw * (rowArea / totalArea); }
      else { y += rh * (rowArea / totalArea); rh -= rh * (rowArea / totalArea); }
      row = [last];
      rowArea = last.a;
    }
  }
  if (row.length) place(result, row, rowArea, x, y, rw, rh, horizontal);
  return result;
}

function worst(row: any[], side: number, other: number): number {
  const sum = row.reduce((s: number, r: any) => s + r.a, 0);
  const rowH = sum / side;
  let max = 0;
  for (const r of row) {
    const r2 = Math.max(rowH * rowH * other / r.a / side, r.a * side / (rowH * rowH * other));
    if (r2 > max) max = r2;
  }
  return max;
}

function place(result: any[], row: any[], area: number, x: number, y: number, w: number, h: number, hor: boolean) {
  const sideLen = area / (hor ? h : w);
  let off = hor ? y : x;
  for (const item of row) {
    const d = item.a / sideLen;
    if (hor) { result.push({ x, y: off, w: sideLen, h: d, ...item }); off += d; }
    else { result.push({ x: off, y, w: d, h: sideLen, ...item }); off += d; }
  }
}
