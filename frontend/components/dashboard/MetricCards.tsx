// components/dashboard/MetricCards.tsx
// Top-row summary stat cards for the overview tab

import type { ProductSentimentSummary } from "@/types";

interface Props {
  summary: ProductSentimentSummary;
}

interface Card {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}

export function MetricCards({ summary }: Props) {
  const cards: Card[] = [
    {
      label: "Total reviews",
      value: summary.total_reviews,
      color: "text-violet-600",
    },
    {
      label: "Aspect mentions",
      value: summary.total_mentions,
      color: "text-emerald-600",
    },
    {
      label: "Positive signals",
      value: summary.positive_mentions,
      sub: `${summary.total_mentions > 0 ? Math.round(summary.positive_mentions / summary.total_mentions * 100) : 0}% of mentions`,
      color: "text-emerald-600",
    },
    {
      label: "Negative signals",
      value: summary.negative_mentions,
      sub: `${summary.total_mentions > 0 ? Math.round(summary.negative_mentions / summary.total_mentions * 100) : 0}% of mentions`,
      color: "text-orange-600",
    },
    {
      label: "Overall score",
      value: `${summary.overall_score}%`,
      sub: summary.overall_score >= 60 ? "Generally positive" : summary.overall_score >= 40 ? "Mixed sentiment" : "Mostly negative",
      color: summary.overall_score >= 60 ? "text-emerald-600" : summary.overall_score >= 40 ? "text-amber-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{c.label}</p>
          <p className={`text-2xl font-medium ${c.color}`}>{c.value}</p>
          {c.sub && (
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
