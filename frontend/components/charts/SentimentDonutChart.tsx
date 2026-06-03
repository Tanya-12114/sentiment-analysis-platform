// components/charts/SentimentDonutChart.tsx
// Recharts pie/donut chart for overall pos/neg/neutral split

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  positive: number;
  negative: number;
  neutral?: number;
}

const COLORS = ["#1D9E75", "#D85A30", "#B4B2A9"];
const LABELS = ["Positive", "Negative", "Neutral"];

export function SentimentDonutChart({ positive, negative, neutral = 0 }: Props) {
  const raw = [positive, negative, neutral];
  const total = raw.reduce((a, b) => a + b, 0) || 1;

  const data = LABELS.map((name, i) => ({
    name,
    value: raw[i],
    pct: Math.round((raw[i] / total) * 100),
  })).filter((d) => d.value > 0);

  const posPercent = Math.round((positive / total) * 100);

  return (
    <div className="relative flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={56}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v: number, name: string) => [`${v} (${Math.round(v / total * 100)}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-medium leading-none">{posPercent}%</span>
          <span className="text-[11px] text-gray-400 mt-0.5">positive</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: COLORS[i] }}
            />
            {d.name} {d.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}
