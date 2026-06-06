// components/analyze/TextAnalyzer.tsx
// Live ABSA text input panel — calls the FastAPI /analysis/analyze endpoint

"use client";

import { useState } from "react";
import { useAnalyze } from "@/hooks/useAbsa";
import type { AspectPrediction } from "@/types";

const EXAMPLE_REVIEWS = [
  "The screen is beautiful and colors are vibrant, but the battery drains in under 6 hours and the keyboard feels mushy.",
  "Suction power is phenomenal for pet hair but the machine is too loud and much heavier than expected.",
  "Incredible value for money. Sound quality rivals headphones costing 3x the price. Build feels cheap though.",
  "The camera is incredible for the price, but the battery drains too fast and the software has annoying bugs.",
];

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const cfg: Record<string, string> = {
    positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    negative: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    neutral:  "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    mixed:    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };
  return (
    <span className={`text-sm font-semibold px-3 py-1 rounded-full border capitalize ${cfg[sentiment] ?? cfg.neutral}`}>
      {sentiment}
    </span>
  );
}

function AspectRow({ pred }: { pred: AspectPrediction }) {
  const barColor =
    pred.sentiment === "positive"
      ? "bg-emerald-500"
      : pred.sentiment === "negative"
      ? "bg-orange-500"
      : "bg-gray-400";

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold capitalize text-gray-800 dark:text-gray-200 truncate">
          {pred.aspect}
        </p>
        {pred.opinion_phrase && (
          <p className="text-sm text-gray-400 italic mt-0.5 truncate">"{pred.opinion_phrase}"</p>
        )}
      </div>

      <SentimentBadge sentiment={pred.sentiment} />

      <div className="flex items-center gap-2 shrink-0">
        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.round(pred.confidence * 100)}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 w-9 text-right tabular-nums">
          {Math.round(pred.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

export function TextAnalyzer({ productId }: { productId?: string }) {
  const [text, setText] = useState("");
  const { result, loading, error, analyze, reset } = useAnalyze();

  const handleAnalyze = () => {
    if (text.trim().length >= 10) analyze(text, productId);
  };

  const handleExample = (ex: string) => {
    setText(ex);
    reset();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Input card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Live ABSA Analyzer</h3>
            <p className="text-sm text-gray-400 mt-1">
              Paste any product review — the NLP pipeline extracts aspects and classifies sentiment in real time.
            </p>
          </div>
          {result && (
            <span className="text-sm text-gray-400">
              {result.processing_time_ms.toFixed(0)} ms
            </span>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); reset(); }}
          placeholder="e.g. The camera is incredible for the price, but battery life is terrible and software crashes constantly..."
          rows={4}
          className="w-full resize-y text-base px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-800 transition leading-relaxed"
        />

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-400">{text.length} chars</span>
          <button
            onClick={handleAnalyze}
            disabled={loading || text.trim().length < 10}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
              loading || text.trim().length < 10
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⟳</span> Analyzing…
              </>
            ) : (
              <>✦ Analyze</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-base text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
          {/* Summary banner */}
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm text-gray-400 mb-1.5">Overall sentiment</p>
              <SentimentBadge sentiment={result.overall_sentiment} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1.5">Aspects found</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {result.aspects.length}
              </p>
            </div>
          </div>

          {/* Summary text */}
          <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 mb-5 leading-relaxed">
            ℹ {result.summary}
          </p>

          {/* Aspect rows */}
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Extracted aspects
            </p>
            {result.aspects.length === 0 ? (
              <p className="text-base text-gray-400 py-4 text-center">
                No specific aspects detected.
              </p>
            ) : (
              result.aspects.map((pred, i) => <AspectRow key={i} pred={pred} />)
            )}
          </div>
        </div>
      )}

      {/* Example reviews */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Try an example
        </p>
        <div className="flex flex-col gap-2.5">
          {EXAMPLE_REVIEWS.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleExample(ex)}
              className="text-left text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:border-violet-300 dark:hover:border-violet-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all leading-relaxed"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}