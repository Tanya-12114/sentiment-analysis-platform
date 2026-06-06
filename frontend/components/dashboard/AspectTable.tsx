// components/dashboard/AspectTable.tsx
// Sortable table showing per-aspect sentiment stats

"use client";

import { useState } from "react";
import type { AspectStats } from "@/types";

interface Props {
  data: AspectStats[];
}

type SortKey = keyof AspectStats;

function MiniBar({ positive, negative, total }: { positive: number; negative: number; total: number }) {
  const posW = Math.round((positive / total) * 100);
  const negW = Math.round((negative / total) * 100);
  return (
    <div className="flex h-2.5 w-full rounded overflow-hidden gap-px min-w-[90px]">
      {posW > 0 && (
        <div style={{ width: `${posW}%` }} className="bg-emerald-500 opacity-80" />
      )}
      {100 - posW - negW > 0 && (
        <div style={{ width: `${100 - posW - negW}%` }} className="bg-gray-200 dark:bg-gray-600" />
      )}
      {negW > 0 && (
        <div style={{ width: `${negW}%` }} className="bg-orange-500 opacity-80" />
      )}
    </div>
  );
}

export function AspectTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortAsc ? av - bv : bv - av;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      className="text-left text-sm font-semibold text-gray-500 py-3 px-4 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
    >
      {label}
      {sortKey === k && <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <Th label="Aspect" k="aspect" />
            <Th label="Mentions" k="total" />
            <Th label="Pos / Neg" k="positive" />
            <Th label="Sentiment score" k="sentiment_score" />
            <Th label="Avg confidence" k="avg_confidence" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr
              key={a.aspect}
              className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td className="py-3.5 px-4 capitalize font-semibold text-gray-800 dark:text-gray-200">{a.aspect}</td>
              <td className="py-3.5 px-4 tabular-nums text-gray-700 dark:text-gray-300">{a.total}</td>
              <td className="py-3.5 px-4 min-w-[130px]">
                <MiniBar positive={a.positive} negative={a.negative} total={a.total} />
                <span className="text-sm text-gray-400 mt-1.5 block">
                  {a.positive}↑  {a.negative}↓
                </span>
              </td>
              <td className="py-3.5 px-4 tabular-nums">
                <span
                  className={`font-semibold text-base ${
                    a.sentiment_score > 0
                      ? "text-emerald-600"
                      : a.sentiment_score < 0
                      ? "text-orange-600"
                      : "text-gray-400"
                  }`}
                >
                  {a.sentiment_score > 0 ? "+" : ""}{a.sentiment_score}
                </span>
              </td>
              <td className="py-3.5 px-4 tabular-nums text-gray-500">
                {Math.round(a.avg_confidence * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}