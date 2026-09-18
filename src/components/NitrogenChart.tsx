"use client";

import dynamic from 'next/dynamic';
import { useApp } from '@/lib/context';

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const ScatterChart = dynamic(() => import('recharts').then(mod => mod.ScatterChart), { ssr: false });
const Scatter = dynamic(() => import('recharts').then(mod => mod.Scatter), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

interface NitrogenChartProps {
  data: { nitrogen: number; height: number }[];
}

export function NitrogenChart({ data }: NitrogenChartProps) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  // Recharts takes literal colors (CSS var() doesn't resolve in SVG
  // presentation attributes), so pick per-theme values matching globals.css.
  const grid = isDark ? '#2A302C' : '#E7E5E0';
  const tickFill = isDark ? '#7C7C86' : '#9F9FA9';
  const labelFill = isDark ? '#A7A7B0' : '#71717A';
  const scatterFill = isDark ? '#6FC2A0' : '#1A3C34';
  const tooltipBg = isDark ? '#181C1A' : 'white';
  const tooltipBorder = isDark ? '#2A302C' : '#E7E5E0';
  const tooltipColor = isDark ? '#E8E6E1' : '#18181B';

  return (
    <div className="border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis
              dataKey="nitrogen"
              type="number"
              tick={{ fontSize: 11, fill: tickFill, fontFamily: 'var(--font-geist-mono)' }}
              label={{ value: 'Nitrogen (kg/ha)', position: 'bottom', offset: 0, style: { fontSize: 11, fill: labelFill } }}
              axisLine={{ stroke: grid }}
              tickLine={{ stroke: grid }}
            />
            <YAxis
              dataKey="height"
              type="number"
              tick={{ fontSize: 11, fill: tickFill, fontFamily: 'var(--font-geist-mono)' }}
              label={{ value: 'Height (cm)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: labelFill } }}
              axisLine={{ stroke: grid }}
              tickLine={{ stroke: grid }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: grid }}
              contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, fontSize: '12px', borderRadius: '0', color: tooltipColor }}
              labelStyle={{ color: tooltipColor }}
              itemStyle={{ color: tooltipColor }}
            />
            <Scatter data={data} fill={scatterFill} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)] text-center mt-1 font-mono">nitrogen vs plant height · n=5</p>
    </div>
  );
}
