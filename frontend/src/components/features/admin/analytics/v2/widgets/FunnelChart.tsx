import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Layers } from 'lucide-react';
import { CHART } from '@/constants/analyticsColors';

interface FunnelStage {
  stage: string;
  count: number;
}

interface Props {
  title: string;
  subtitle?: string;
  data: FunnelStage[];
  loading?: boolean;
  height?: number;
}

const COLORS = CHART.funnelStages;
const STAGE_WIDTHS = [100, 88, 76, 64, 52];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/95 border border-gold/20 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-serif font-bold text-rosewood mb-1">{d.stage}</p>
      <p className="text-slate-600">{d.count.toLocaleString()} accounts</p>
    </div>
  );
};

const CustomizedBar = (props: any) => {
  const { x, y, width, height, index, payload } = props;
  const pct = STAGE_WIDTHS[index] / 100;
  const barWidth = width * pct;
  const offset = (width - barWidth) / 2;
  return (
    <g>
      <rect x={x + offset} y={y} width={barWidth} height={height} fill={COLORS[index % COLORS.length]} rx={6} />
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#6B7280" fontSize={11} fontWeight={700}>
        {payload.count.toLocaleString()}
      </text>
    </g>
  );
};

export const FunnelChart: React.FC<Props> = React.memo(({ title, subtitle, data, loading, height = 340 }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm animate-pulse">
        <div className="p-5 border-b border-gold/10">
          <div className="h-4 w-44 bg-rosewood/10 rounded" />
          {subtitle && <div className="h-3 w-28 bg-rosewood/5 rounded mt-1.5" />}
        </div>
        <div className="h-[280px] bg-ivory-tint/30 m-4 rounded-lg" />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gold/10">
          <h3 className="font-serif font-bold text-rosewood">{title}</h3>
          {subtitle && <p className="text-xs text-dark-brown/60 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-6"><EmptyState message="No funnel data yet" icon={Layers} variant="dashed" /></div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gold/20 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gold/10">
        <h3 className="font-serif font-bold text-rosewood">{title}</h3>
        {subtitle && <p className="text-xs text-dark-brown/60 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 16, right: 16, left: 16, bottom: 8 }} barCategoryGap={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" hide axisLine={false} tickLine={false} domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" shape={<CustomizedBar />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

FunnelChart.displayName = 'FunnelChart';
