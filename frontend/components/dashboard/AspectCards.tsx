// components/dashboard/AspectCards.tsx
// Card grid showing per-aspect breakdown with trend sparkline data

"use client";

import type { AspectStats } from "@/types";

interface Props {
  data: AspectStats[];
}

function MiniBar({
  positive,
  negative,
  total,
}: {
  positive: number;
  negative: number;
  total: number;
}) {
  const posW = Math.round((positive / total) * 100);
  const negW = Math.round((negative / total) * 100);
  const neuW = 100 - posW - negW;

  return (
    <div className="flex h-2 w-full rounded overflow-hidden gap-px">
      {posW > 0 && (
        <div
          style={{ width: `${posW}%` }}
          className="bg-emerald-500 opacity-75 transition-all duration-500"
        />
      )}
      {neuW > 0 && (
        <div
          style={{ width: `${neuW}%` }}
          className="bg-gray-200 dark:bg-gray-600"
        />
      )}
      {negW > 0 && (
        <div
          style={{ width: `${negW}%` }}
          className="bg-orange-500 opacity-75 transition-all duration-500"
        />
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const isPos = score > 10;
  const isNeg = score < -10;
  const base = "text-xs font-medium px-2 py-0.5 rounded-full";

  if (isPos)
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`}>
        +{score}
      </span>
    );
  if (isNeg)
    return (
      <span className={`${base} bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`}>
        {score}
      </span>
    );
  return (
    <span className={`${base} bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400`}>
      {score > 0 ? "+" : ""}{score}
    </span>
  );
}

export function AspectCards({ data }: Props) {
  if (!data.length) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">No aspect data available.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {data.map((a) => (
        <div
          key={a.aspect}
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">
              {a.aspect}
            </span>
            <ScoreBadge score={a.sentiment_score} />
          </div>

          <MiniBar positive={a.positive} negative={a.negative} total={a.total} />

          <div className="flex justify-between mt-2.5 text-xs">
            <span className="text-emerald-600 font-medium">+{a.positive}</span>
            <span className="text-gray-400">{a.total} total</span>
            <span className="text-orange-600 font-medium">−{a.negative}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between text-xs text-gray-400">
            <span>Confidence</span>
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {Math.round(a.avg_confidence * 100)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
