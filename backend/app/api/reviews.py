"""
api/reviews.py — Review CRUD and processing endpoints.
"""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.schemas import ReviewCreate, ReviewRead
from app.services import review_service

router = APIRouter()


@router.post("/", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Add a new review and optionally trigger ABSA processing."""
    review = await review_service.create_review(data, db)
    pipeline = request.app.state.nlp_pipeline
    if pipeline and pipeline._loaded:
        review = await review_service.process_review(review, pipeline, db)
    return review


@router.get("/product/{product_id}", response_model=List[ReviewRead])
async def list_reviews(
    product_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sentiment: Optional[str] = Query(None, pattern="^(positive|negative|neutral)$"),
    db: AsyncSession = Depends(get_db),
):
    """List reviews for a product with optional sentiment filter."""
    return await review_service.get_reviews_for_product(
        product_id, db, limit=limit, offset=offset, sentiment_filter=sentiment
    )


@router.post("/product/{product_id}/process")
async def process_reviews(
    product_id: uuid.UUID,
    request: Request,
    batch_size: int = Query(16, ge=1, le=64),
    db: AsyncSession = Depends(get_db),
):
    """Trigger ABSA processing for unprocessed reviews of a product."""
    pipeline = request.app.state.nlp_pipeline
    if not pipeline or not pipeline._loaded:
        raise HTTPException(status_code=503, detail="NLP pipeline not ready")

    count = await review_service.process_unprocessed_batch(product_id, pipeline, db, batch_size)
    return {"processed": count, "product_id": str(product_id)}
