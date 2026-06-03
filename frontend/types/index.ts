// types/index.ts — Shared TypeScript interfaces matching backend Pydantic schemas

export interface Product {
  id: string;
  name: string;
  asin?: string;
  category?: string;
  image_url?: string;
  created_at: string;
  review_count: number;
}

export interface AspectResult {
  id: string;
  aspect: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  opinion_phrase?: string;
}

export interface Review {
  id: string;
  product_id: string;
  body: string;
  rating?: number;
  reviewer_name?: string;
  verified_purchase: boolean;
  review_date?: string;
  source: string;
  processed: boolean;
  created_at: string;
  aspect_results: AspectResult[];
}

export interface AspectStats {
  aspect: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  avg_confidence: number;
  sentiment_score: number;
}

export interface ProductSentimentSummary {
  product_id: string;
  product_name: string;
  total_reviews: number;
  total_mentions: number;
  positive_mentions: number;
  negative_mentions: number;
  overall_score: number;
  aspect_stats: AspectStats[];
}

export interface TimeSeriesPoint {
  month: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface ProductTimeSeries {
  product_id: string;
  series: TimeSeriesPoint[];
}

export interface AspectPrediction {
  aspect: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  opinion_phrase?: string;
}

export interface AnalyzeResponse {
  aspects: AspectPrediction[];
  overall_sentiment: string;
  summary: string;
  processing_time_ms: number;
}

export interface ScrapeJob {
  id: string;
  product_id: string;
  status: "pending" | "running" | "done" | "failed";
  reviews_found: number;
  reviews_new: number;
  error_message?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export type SentimentFilter = "all" | "positive" | "negative" | "neutral";
export type DashboardTab = "overview" | "aspects" | "timeline" | "reviews" | "pipeline" | "analyze";
