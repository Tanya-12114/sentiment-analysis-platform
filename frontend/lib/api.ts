// lib/api.ts — Typed fetch wrapper for all backend endpoints

import type {
  AnalyzeResponse,
  Product,
  ProductSentimentSummary,
  ProductTimeSeries,
  Review,
  ScrapeJob,
  SentimentFilter,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "API error");
  }
  return res.json() as Promise<T>;
}

// ---- Products --------------------------------------------------------------
export const productsApi = {
  list: () => apiFetch<Product[]>("/products"),
  get: (id: string) => apiFetch<Product>(`/products/${id}`),
  create: (data: Partial<Product>) =>
    apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
};

// ---- Reviews ---------------------------------------------------------------
export const reviewsApi = {
  list: (
    productId: string,
    params?: { limit?: number; offset?: number; sentiment?: SentimentFilter }
  ) => {
    const q = new URLSearchParams();
    if (params?.limit)     q.set("limit", String(params.limit));
    if (params?.offset)    q.set("offset", String(params.offset));
    if (params?.sentiment && params.sentiment !== "all") q.set("sentiment", params.sentiment);
    return apiFetch<Review[]>(`/reviews/product/${productId}?${q}`);
  },
  process: (productId: string) =>
    apiFetch<{ processed: number }>(`/reviews/product/${productId}/process`, { method: "POST" }),
};

// ---- Analysis --------------------------------------------------------------
export const analysisApi = {
  analyze: (text: string, productId?: string) =>
    apiFetch<AnalyzeResponse>("/analysis/analyze", {
      method: "POST",
      body: JSON.stringify({ text, product_id: productId }),
    }),
  summary: (productId: string) =>
    apiFetch<ProductSentimentSummary>(`/analysis/summary/${productId}`),
  timeSeries: (productId: string) =>
    apiFetch<ProductTimeSeries>(`/analysis/timeseries/${productId}`),
};

// ---- Scraper ---------------------------------------------------------------
export const scraperApi = {
  createJob: (productId: string, maxPages = 3) =>
    apiFetch<ScrapeJob>("/scraper/jobs", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, max_pages: maxPages }),
    }),
  getJob: (jobId: string) => apiFetch<ScrapeJob>(`/scraper/jobs/${jobId}`),
};

// ---- Health ----------------------------------------------------------------
export const healthApi = {
  ready: () => apiFetch<{ status: string; pipeline: boolean }>("/health/ready"),
};
