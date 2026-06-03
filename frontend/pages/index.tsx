// pages/index.tsx  (Next.js pages router entry point)
// Orchestrates product selection, tab routing, and data fetching

"use client";

import { useState } from "react";
import { useProducts, useSummary, useTimeSeries, useReviews, useScraper } from "@/hooks/useAbsa";
import { ProductSelector } from "@/components/dashboard/ProductSelector";
import { TabNav } from "@/components/dashboard/TabNav";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { AspectTable } from "@/components/dashboard/AspectTable";
import { AspectCards } from "@/components/dashboard/AspectCards";
import { SentimentTimeSeriesChart } from "@/components/charts/SentimentTimeSeriesChart";
import { AspectBarChart } from "@/components/charts/AspectBarChart";
import { SentimentDonutChart } from "@/components/charts/SentimentDonutChart";
import { ReviewList } from "@/components/reviews/ReviewList";
import { PipelineVisualizer } from "@/components/pipeline/PipelineVisualizer";
import { ScraperPanel } from "@/components/pipeline/ScraperPanel";
import { TextAnalyzer } from "@/components/analyze/TextAnalyzer";
import type { DashboardTab, SentimentFilter } from "@/types";

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 ${className}`}
    >
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</p>
      {children}
    </div>
  );
}

function LoadingShimmer({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");

  // Data
  const { data: products, loading: productsLoading } = useProducts();
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  // Set first product as default once loaded
  const resolvedProductId =
    activeProductId ?? products?.[0]?.id ?? null;

  const { data: summary, loading: summaryLoading } = useSummary(resolvedProductId);
  const { data: timeSeries, loading: tsLoading } = useTimeSeries(resolvedProductId);
  const { data: reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(
    resolvedProductId,
    sentimentFilter
  );
  const { job: scrapeJob, starting: scrapeStarting, startJob: startScrape } = useScraper(
    resolvedProductId
  );

  const handleProductChange = (id: string) => {
    setActiveProductId(id);
    setSentimentFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                E-Commerce Analytics
              </p>
              <h1 className="text-xl font-semibold mt-0.5">
                Aspect-Based Sentiment Analysis
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              NLP pipeline active
            </div>
          </div>

          {/* Product pills */}
          <ProductSelector
            products={products ?? []}
            activeId={resolvedProductId}
            onChange={handleProductChange}
            loading={productsLoading}
          />
        </div>
      </header>

      {/* ── Tab Nav ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <TabNav active={tab} onChange={setTab} />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            {summaryLoading ? (
              <LoadingShimmer rows={1} />
            ) : summary ? (
              <MetricCards summary={summary} />
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <SectionCard title="Aspect sentiment breakdown" className="lg:col-span-3">
                {summaryLoading ? (
                  <LoadingShimmer />
                ) : summary?.aspect_stats ? (
                  <AspectBarChart data={summary.aspect_stats} />
                ) : null}
              </SectionCard>

              <SectionCard title="Overall distribution" className="lg:col-span-2">
                {summaryLoading ? (
                  <LoadingShimmer rows={2} />
                ) : summary ? (
                  <div className="flex flex-col items-center gap-4">
                    <SentimentDonutChart
                      positive={summary.positive_mentions}
                      negative={summary.negative_mentions}
                    />
                    <div className="w-full divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                      {[
                        { label: "Positive", v: summary.positive_mentions, color: "text-emerald-600" },
                        { label: "Negative", v: summary.negative_mentions, color: "text-orange-600" },
                      ].map((r) => (
                        <div key={r.label} className="flex justify-between py-2">
                          <span className="text-gray-500">{r.label}</span>
                          <span className={`font-medium ${r.color}`}>
                            {r.v}{" "}
                            <span className="text-gray-400 font-normal text-xs">
                              (
                              {summary.total_mentions > 0
                                ? Math.round((r.v / summary.total_mentions) * 100)
                                : 0}
                              %)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </SectionCard>
            </div>

            <SectionCard title="Aspect performance matrix">
              {summaryLoading ? (
                <LoadingShimmer />
              ) : summary?.aspect_stats ? (
                <AspectTable data={summary.aspect_stats} />
              ) : null}
            </SectionCard>
          </>
        )}

        {/* ── ASPECTS ──────────────────────────────────────────────── */}
        {tab === "aspects" && (
          summary?.aspect_stats ? (
            <AspectCards data={summary.aspect_stats} />
          ) : (
            <LoadingShimmer />
          )
        )}

        {/* ── TIMELINE ─────────────────────────────────────────────── */}
        {tab === "timeline" && (
          <div className="space-y-5">
            <SectionCard title="Sentiment signals over time">
              {tsLoading ? (
                <LoadingShimmer rows={4} />
              ) : timeSeries?.series ? (
                <SentimentTimeSeriesChart data={timeSeries.series} />
              ) : null}
            </SectionCard>
          </div>
        )}

        {/* ── REVIEWS ──────────────────────────────────────────────── */}
        {tab === "reviews" && (
          <ReviewList
            reviews={reviews ?? []}
            loading={reviewsLoading}
            onFilterChange={(f) => setSentimentFilter(f)}
          />
        )}

        {/* ── NLP PIPELINE ─────────────────────────────────────────── */}
        {tab === "pipeline" && (
          <div className="space-y-5">
            <SectionCard title="NLP pipeline visualizer">
              <PipelineVisualizer onRunComplete={refetchReviews} />
            </SectionCard>
            <ScraperPanel
              job={scrapeJob}
              starting={scrapeStarting}
              onStart={startScrape}
            />
          </div>
        )}

        {/* ── ANALYZE TEXT ─────────────────────────────────────────── */}
        {tab === "analyze" && (
          <TextAnalyzer productId={resolvedProductId ?? undefined} />
        )}
      </main>
    </div>
  );
}
