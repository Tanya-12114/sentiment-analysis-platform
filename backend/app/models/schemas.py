"""
models/schemas.py — Pydantic v2 schemas for all API request/response types.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Product schemas
# ---------------------------------------------------------------------------
class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    asin: Optional[str] = Field(None, max_length=20)
    category: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: uuid.UUID
    created_at: datetime
    review_count: int = 0

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Review schemas
# ---------------------------------------------------------------------------
class ReviewBase(BaseModel):
    body: str = Field(..., min_length=5)
    rating: Optional[float] = Field(None, ge=1, le=5)
    reviewer_name: Optional[str] = None
    verified_purchase: bool = False
    review_date: Optional[datetime] = None
    source: str = "manual"


class ReviewCreate(ReviewBase):
    product_id: uuid.UUID


class AspectResultRead(BaseModel):
    id: uuid.UUID
    aspect: str
    sentiment: str
    confidence: float
    opinion_phrase: Optional[str] = None

    model_config = {"from_attributes": True}


class ReviewRead(ReviewBase):
    id: uuid.UUID
    product_id: uuid.UUID
    processed: bool
    created_at: datetime
    aspect_results: List[AspectResultRead] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Analysis schemas
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=2000)
    product_id: Optional[uuid.UUID] = None

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class AspectPrediction(BaseModel):
    aspect: str
    sentiment: str
    confidence: float
    opinion_phrase: Optional[str] = None


class AnalyzeResponse(BaseModel):
    aspects: List[AspectPrediction]
    overall_sentiment: str
    summary: str
    processing_time_ms: float


# ---------------------------------------------------------------------------
# Aggregation / dashboard schemas
# ---------------------------------------------------------------------------
class AspectStats(BaseModel):
    aspect: str
    positive: int
    negative: int
    neutral: int
    total: int
    avg_confidence: float
    sentiment_score: float   # (pos - neg) / total * 100


class ProductSentimentSummary(BaseModel):
    product_id: uuid.UUID
    product_name: str
    total_reviews: int
    total_mentions: int
    positive_mentions: int
    negative_mentions: int
    overall_score: float
    aspect_stats: List[AspectStats]


class TimeSeriesPoint(BaseModel):
    month: str  # "YYYY-MM"
    positive: int
    negative: int
    neutral: int
    total: int


class ProductTimeSeries(BaseModel):
    product_id: uuid.UUID
    series: List[TimeSeriesPoint]


# ---------------------------------------------------------------------------
# Scraper schemas
# ---------------------------------------------------------------------------
class ScrapeJobCreate(BaseModel):
    product_id: uuid.UUID
    max_pages: int = Field(3, ge=1, le=10)


class ScrapeJobRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    status: str
    reviews_found: int
    reviews_new: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
