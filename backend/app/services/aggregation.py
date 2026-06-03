"""
services/aggregation.py — Pandas + NumPy based analytics aggregations.

All heavy number-crunching goes here so the API routes stay thin.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List

import numpy as np
import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Product, Review, AspectResult
from app.models.schemas import (
    AspectStats,
    ProductSentimentSummary,
    ProductTimeSeries,
    TimeSeriesPoint,
)


# ---------------------------------------------------------------------------
# Core aggregation helpers
# ---------------------------------------------------------------------------

def _build_aspect_df(aspect_rows: list[dict]) -> pd.DataFrame:
    """Convert raw DB rows to a clean DataFrame."""
    if not aspect_rows:
        return pd.DataFrame(columns=["aspect", "sentiment", "confidence"])
    return pd.DataFrame(aspect_rows)


def compute_aspect_stats(df: pd.DataFrame) -> List[AspectStats]:
    """Aggregate per-aspect sentiment counts and scores."""
    if df.empty:
        return []

    grouped = (
        df.groupby("aspect")
        .agg(
            total=("sentiment", "count"),
            positive=("sentiment", lambda s: (s == "positive").sum()),
            negative=("sentiment", lambda s: (s == "negative").sum()),
            neutral=("sentiment", lambda s: (s == "neutral").sum()),
            avg_confidence=("confidence", "mean"),
        )
        .reset_index()
        .sort_values("total", ascending=False)
    )

    stats = []
    for _, row in grouped.iterrows():
        score = float(np.divide(
            (row["positive"] - row["negative"]),
            row["total"],
        ) * 100) if row["total"] > 0 else 0.0

        stats.append(AspectStats(
            aspect=row["aspect"],
            positive=int(row["positive"]),
            negative=int(row["negative"]),
            neutral=int(row["neutral"]),
            total=int(row["total"]),
            avg_confidence=round(float(row["avg_confidence"]), 3),
            sentiment_score=round(score, 1),
        ))

    return stats


def compute_time_series(df: pd.DataFrame, review_dates: dict[str, datetime]) -> List[TimeSeriesPoint]:
    """
    Build monthly time-series by joining aspect results with review dates.

    df must have columns: aspect_id, review_id, sentiment
    review_dates: {review_id: datetime}
    """
    if df.empty or not review_dates:
        return []

    df = df.copy()
    df["review_date"] = df["review_id"].map(review_dates)
    df = df.dropna(subset=["review_date"])
    df["month"] = pd.to_datetime(df["review_date"]).dt.to_period("M").astype(str)

    monthly = (
        df.groupby("month")
        .agg(
            total=("sentiment", "count"),
            positive=("sentiment", lambda s: (s == "positive").sum()),
            negative=("sentiment", lambda s: (s == "negative").sum()),
            neutral=("sentiment", lambda s: (s == "neutral").sum()),
        )
        .reset_index()
        .sort_values("month")
    )

    return [
        TimeSeriesPoint(
            month=row["month"],
            positive=int(row["positive"]),
            negative=int(row["negative"]),
            neutral=int(row["neutral"]),
            total=int(row["total"]),
        )
        for _, row in monthly.iterrows()
    ]


# ---------------------------------------------------------------------------
# Database-level aggregation queries
# ---------------------------------------------------------------------------

async def get_product_summary(
    product_id: uuid.UUID,
    db: AsyncSession,
) -> ProductSentimentSummary | None:
    """Fetch and aggregate full sentiment summary for one product."""

    product = await db.get(Product, product_id)
    if not product:
        return None

    # Fetch all reviews with aspect results
    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id)
        .options(selectinload(Review.aspect_results))
    )
    reviews = result.scalars().all()

    # Flatten to rows
    rows = []
    date_map = {}
    for rev in reviews:
        date_map[str(rev.id)] = rev.review_date
        for ar in rev.aspect_results:
            rows.append({
                "review_id": str(rev.id),
                "aspect": ar.aspect,
                "sentiment": ar.sentiment,
                "confidence": ar.confidence,
            })

    df = _build_aspect_df(rows)
    aspect_stats = compute_aspect_stats(df)

    total_mentions = len(df)
    positive_mentions = int((df["sentiment"] == "positive").sum()) if not df.empty else 0
    negative_mentions = int((df["sentiment"] == "negative").sum()) if not df.empty else 0
    overall_score = round(positive_mentions / total_mentions * 100, 1) if total_mentions > 0 else 50.0

    return ProductSentimentSummary(
        product_id=product_id,
        product_name=product.name,
        total_reviews=len(reviews),
        total_mentions=total_mentions,
        positive_mentions=positive_mentions,
        negative_mentions=negative_mentions,
        overall_score=overall_score,
        aspect_stats=aspect_stats,
    )


async def get_product_time_series(
    product_id: uuid.UUID,
    db: AsyncSession,
) -> ProductTimeSeries:
    """Compute monthly sentiment time-series for a product."""

    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id)
        .options(selectinload(Review.aspect_results))
    )
    reviews = result.scalars().all()

    rows = []
    date_map = {}
    for rev in reviews:
        date_map[str(rev.id)] = rev.review_date
        for ar in rev.aspect_results:
            rows.append({"review_id": str(rev.id), "sentiment": ar.sentiment})

    df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["review_id", "sentiment"])
    series = compute_time_series(df, date_map)

    return ProductTimeSeries(product_id=product_id, series=series)
