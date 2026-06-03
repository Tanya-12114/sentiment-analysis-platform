// components/charts/AspectBarChart.tsx
// Stacked horizontal bar chart: positive vs negative per aspect

"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AspectStats } from "@/types";

interface Props {
  data: AspectStats[];
}

const POS_COLOR = "#1D9E75";
const NEG_COLOR = "#D85A30";

export function AspectBarChart({ data }: Props) {
  const chartData = data.slice(0, 8).map((d) => ({
    aspect: d.aspect.charAt(0).toUpperCase() + d.aspect.slice(1),
    positive: d.positive,
    negative: d.negative,
    score: d.sentiment_score,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 38)}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 0, right: 48, left: 8, bottom: 0 }}
        barCategoryGap="30%"
      >
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="aspect"
          width={110}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)" }}
          formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
        />

        <Bar dataKey="positive" name="positive" stackId="a" fill={POS_COLOR} radius={[0, 0, 0, 0]}>
          <LabelList
            dataKey="positive"
            position="right"
            style={{ fontSize: 11, fill: POS_COLOR }}
          />
        </Bar>
        <Bar dataKey="negative" name="negative" stackId="a" fill={NEG_COLOR} radius={[0, 4, 4, 0]}>
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
