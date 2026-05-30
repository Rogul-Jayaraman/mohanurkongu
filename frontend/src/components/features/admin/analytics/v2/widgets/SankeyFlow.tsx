import React from 'react';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { GitBranch } from 'lucide-react';

interface Link { source: string; target: string; value: number }
interface Node { name: string; color?: string }

interface Props { title: string; subtitle?: string; nodes: Node[]; links: Link[]; loading?: boolean }

const NODE_COLORS = ['#6B0028', '#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444', '#819683'];

export const SankeyFlow: React.FC<Props> = ({ title, subtitle, nodes, links, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10"><div className="h-4 w-48 bg-rosewood/10 rounded" />{subtitle && <div className="h-3 w-32 bg-rosewood/5 rounded mt-1.5" />}</div>
        <div className="h-[200px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  const nodeMap = new Map(nodes.map((n, i) => [n.name, { ...n, index: i, color: n.color ?? NODE_COLORS[i % NODE_COLORS.length] }]));
  const totalValue = links.reduce((s, l) => s + l.value, 0) || 1;
  const heightPx = 220;
  const pad = 20;
  const colW = 120;
  const gap = 80;

  const srcNames = [...new Set(links.map(l => l.source))];
  const tgtNames = [...new Set(links.map(l => l.target))];
  const srcNodes = srcNames.map(n => nodeMap.get(n)!);
  const tgtNodes = tgtNames.map(n => nodeMap.get(n)!);
  const srcTotal = links.filter(l => srcNames.includes(l.source)).reduce((s, l) => s + l.value, 0);
  const tgtTotal = links.filter(l => tgtNames.includes(l.target)).reduce((s, l) => s + l.value, 0);
  const srcLayout = lay(srcNodes, srcTotal, heightPx, pad);
  const tgtLayout = lay(tgtNodes, tgtTotal, heightPx, pad);

  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {links.length === 0 ? (
        <div className="p-6"><EmptyState message="No flow data" icon={GitBranch} variant="dashed" /></div>
      ) : (
        <div className="p-4">
          <svg width="100%" height={heightPx} viewBox={`0 0 ${colW + gap + colW} ${heightPx}`} className="overflow-visible">
            {links.map((link, i) => {
              const src = nodeMap.get(link.source), tgt = nodeMap.get(link.target);
              if (!src || !tgt) return null;
              const sl = srcLayout.get(src.name), tl = tgtLayout.get(tgt.name);
              if (!sl || !tl) return null;
              const sy = sl.y + sl.h / 2, ty = tl.y + tl.h / 2;
              const sx = colW, tx = colW + gap;
              const op = Math.max(0.12, Math.min(0.45, (link.value / totalValue) * 4));
              return <path key={i} d={`M ${sx} ${sy} C ${(sx + tx) / 2} ${sy}, ${(sx + tx) / 2} ${ty}, ${tx} ${ty}`} fill="none" stroke={src.color} strokeWidth={Math.max(2, (link.value / totalValue) * tgtTotal * 2.5)} opacity={op} />;
            })}
            {renderNodes(srcNodes, srcLayout, 0)}
            {renderNodes(tgtNodes, tgtLayout, colW + gap)}
          </svg>
        </div>
      )}
    </div>
  );
};

function lay(nodes: any[], total: number, h: number, pad: number): Map<string, { y: number; h: number; w: number }> {
  const m = new Map<string, { y: number; h: number; w: number }>();
  const ah = h - pad * 2;
  let y = pad;
  for (const n of nodes) {
    const nh = Math.max(18, (n.value / total) * ah);
    m.set(n.name, { y, h: nh, w: 12 });
    y += nh + 4;
  }
  return m;
}

function renderNodes(nodes: any[], layout: Map<string, any>, x: number) {
  return nodes.map(n => {
    const l = layout.get(n.name);
    if (!l) return null;
    return (
      <g key={n.name}>
        <rect x={x} y={l.y} width={l.w} height={l.h} rx={3} fill={n.color} opacity={0.85} />
        <text x={x + 6} y={l.y + l.h / 2 + 4} fill="white" fontSize={9} fontWeight={600}>
          {n.name.length > 14 ? n.name.slice(0, 14) + '…' : n.name}
        </text>
      </g>
    );
  });
}
