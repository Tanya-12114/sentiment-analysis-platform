// hooks/useAbsa.ts — Custom hooks wrapping the API client with loading/error state

import { useCallback, useEffect, useRef, useState } from "react";
import { analysisApi, productsApi, reviewsApi, scraperApi } from "@/lib/api";
import type {
  AnalyzeResponse,
  Product,
  ProductSentimentSummary,
  ProductTimeSeries,
  Review,
  ScrapeJob,
  SentimentFilter,
} from "@/types";

// ---------------------------------------------------------------------------
// Generic async hook
// ---------------------------------------------------------------------------
function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}

// ---------------------------------------------------------------------------
// Product hooks
// ---------------------------------------------------------------------------
export function useProducts() {
  return useAsync(() => productsApi.list(), []);
}

// ---------------------------------------------------------------------------
// Dashboard data hooks
// ---------------------------------------------------------------------------
export function useSummary(productId: string | null) {
  return useAsync(
    () => (productId ? analysisApi.summary(productId) : Promise.resolve(null)),
    [productId]
  );
}

export function useTimeSeries(productId: string | null) {
  return useAsync(
    () => (productId ? analysisApi.timeSeries(productId) : Promise.resolve(null)),
    [productId]
  );
}

export function useReviews(productId: string | null, filter: SentimentFilter = "all") {
  return useAsync(
    () =>
      productId
        ? reviewsApi.list(productId, { limit: 50, sentiment: filter })
        : Promise.resolve([]),
    [productId, filter]
  );
}

// ---------------------------------------------------------------------------
// Live analysis hook
// ---------------------------------------------------------------------------
export function useAnalyze() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (text: string, productId?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analysisApi.analyze(text, productId);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, analyze, reset: () => setResult(null) };
}

// ---------------------------------------------------------------------------
// Scraper polling hook
// ---------------------------------------------------------------------------
export function useScraper(productId: string | null) {
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startJob = useCallback(async () => {
    if (!productId || starting) return;
    setStarting(true);
    try {
      const newJob = await scraperApi.createJob(productId, 3);
      setJob(newJob);

      pollRef.current = setInterval(async () => {
        const updated = await scraperApi.getJob(newJob.id);
        setJob(updated);
        if (updated.status === "done" || updated.status === "failed") {
          stopPolling();
        }
      }, 1500);
    } catch (e) {
      console.error("Scraper error", e);
    } finally {
      setStarting(false);
    }
  }, [productId, starting, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { job, starting, startJob };
}
