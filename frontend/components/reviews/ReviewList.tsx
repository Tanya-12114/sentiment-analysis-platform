// components/reviews/ReviewList.tsx
// Filterable list of reviews with aspect-sentiment chips

"use client";

import { useState } from "react";
import type { Review, SentimentFilter } from "@/types";

interface Props {
  reviews: Review[];
  loading?: boolean;
  onFilterChange?: (f: SentimentFilter) => void;
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-base ${i < Math.round(rating) ? "text-amber-400" : "text-gray-200 dark:text-gray-600"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function SentimentChip({ sentiment }: { sentiment: string }) {
  const cfg: Record<string, string> = {
    positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    negative: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    neutral:  "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };
  return (
    <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium capitalize ${cfg[sentiment] ?? cfg.neutral}`}>
      {sentiment}
    </span>
  );
}

const FILTERS: { value: SentimentFilter; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "neutral",  label: "Neutral" },
];

function ReviewSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="h-5 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
      <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
    </div>
  );
}

export function ReviewList({ reviews, loading, onFilterChange }: Props) {
  const [filter, setFilter] = useState<SentimentFilter>("all");

  const handleFilter = (f: SentimentFilter) => {
    setFilter(f);
    onFilterChange?.(f);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-sm font-medium text-gray-400 mr-1">Filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all border font-medium ${
              filter === f.value
                ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700 font-semibold"
                : "bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)
      ) : reviews.length === 0 ? (
        <p className="text-base text-gray-400 py-8 text-center">No reviews match this filter.</p>
      ) : (
        reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <StarRating rating={r.rating} />
              {r.verified_purchase && (
                <span className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-medium">
                  Verified
                </span>
              )}
              {r.reviewer_name && (
                <span className="text-sm font-medium text-gray-500">{r.reviewer_name}</span>
              )}
              <span className="ml-auto text-sm text-gray-400">
                {r.review_date
                  ? new Date(r.review_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </span>
            </div>

            {/* Body */}
            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3.5">
              {r.body}
            </p>

            {/* Aspect chips */}
            {r.aspect_results.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {r.aspect_results.map((ar) => (
                  <div
                    key={ar.id}
                    className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-sm capitalize text-gray-700 dark:text-gray-300 font-semibold">
                      {ar.aspect}
                    </span>
                    <SentimentChip sentiment={ar.sentiment} />
                    <span className="text-sm text-gray-400">
                      {Math.round(ar.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!r.processed && (
              <p className="text-sm text-amber-500 mt-2.5">⏳ Pending ABSA processing</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}