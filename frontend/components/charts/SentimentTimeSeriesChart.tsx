// components/charts/SentimentTimeSeriesChart.tsx
// Recharts area chart showing positive/negative/total signals over time

"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint } from "@/types";

interface Props {
  data: TimeSeriesPoint[];
}

const COLORS = {
  positive: "#1D9E75",
  negative: "#D85A30",
  total: "#534AB7",
};

function shortMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

export function SentimentTimeSeriesChart({ data }: Props) {
  if (!data.length) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        Not enough timeline data yet.
      </p>
    );
  }

  const formatted = data.map((d) => ({ ...d, month: shortMonth(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.positive} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS.positive} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.total} stopOpacity={0.15} />
            <stop offset="95%" stopColor={COLORS.total} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)" }}
        />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />

        <Area
          type="monotone"
          dataKey="total"
          name="Total"
          stroke={COLORS.total}
          fill="url(#gradTotal)"
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="positive"
          name="Positive"
          stroke={COLORS.positive}
          fill="url(#gradPos)"
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="negative"
          name="Negative"
          stroke={COLORS.negative}
          fill="url(#gradNeg)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
