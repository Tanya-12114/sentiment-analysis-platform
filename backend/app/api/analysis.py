"""
api/analysis.py — Live ABSA analysis and dashboard aggregation endpoints.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AspectPrediction,
    ProductSentimentSummary,
    ProductTimeSeries,
)
from app.services.aggregation import get_product_summary, get_product_time_series

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(
    body: AnalyzeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Run ABSA on arbitrary review text.
    Optionally persists results if product_id is provided.
    """
    pipeline = request.app.state.nlp_pipeline
    if not pipeline or not pipeline._loaded:
        raise HTTPException(status_code=503, detail="NLP pipeline not ready")

    result = await pipeline.analyze(body.text)

    return AnalyzeResponse(
        aspects=[
            AspectPrediction(
                aspect=p.aspect,
                sentiment=p.sentiment,
                confidence=p.confidence,
                opinion_phrase=p.opinion_phrase or None,
            )
            for p in result.aspects
        ],
        overall_sentiment=result.overall_sentiment,
        summary=result.summary,
        processing_time_ms=result.processing_time_ms,
    )


@router.get("/summary/{product_id}", response_model=ProductSentimentSummary)
async def product_summary(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Aggregated sentiment summary for a product — powers the dashboard overview."""
    summary = await get_product_summary(product_id, db)
    if not summary:
        raise HTTPException(status_code=404, detail="Product not found")
    return summary


@router.get("/timeseries/{product_id}", response_model=ProductTimeSeries)
async def product_timeseries(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Monthly sentiment time-series for the timeline chart."""
    return await get_product_time_series(product_id, db)
