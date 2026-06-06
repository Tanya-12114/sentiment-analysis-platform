"""
services/review_service.py — Business logic for review ingestion and processing.

Separates DB operations from the API layer and the NLP pipeline.
"""

from __future__ import annotations

import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from redis.asyncio import Redis

from app.core.cache import invalidate_product_cache
from app.db.models import AspectResult, Review
from app.models.schemas import ReviewCreate, ReviewRead
from app.pipelines.nlp_pipeline import ABSAPipeline

logger = logging.getLogger(__name__)


async def create_review(data: ReviewCreate, db: AsyncSession) -> Review:
    """Persist a new review (unprocessed) and return the ORM object."""
    review = Review(**data.model_dump())
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


async def get_reviews_for_product(
    product_id: uuid.UUID,
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    sentiment_filter: Optional[str] = None,
) -> List[Review]:
    """Return paginated reviews with their aspect results.

    The sentiment_filter is applied inside SQL (via a JOIN + WHERE) so that
    LIMIT/OFFSET operate on the already-filtered set. Previously the filter
    was applied in Python after fetching a page, which caused pages to silently
    return fewer rows than requested.
    """
    q = (
        select(Review)
        .where(Review.product_id == product_id)
        .options(selectinload(Review.aspect_results))
        .order_by(Review.review_date.desc().nullsfirst())
    )

    if sentiment_filter:
        # Join to aspect_results and filter before paginating.
        # distinct() prevents duplicate Review rows when a review has
        # multiple aspect_results that match the sentiment.
        q = (
            q.join(Review.aspect_results)
             .where(AspectResult.sentiment == sentiment_filter)
             .distinct()
        )

    q = q.limit(limit).offset(offset)

    result = await db.execute(q)
    return list(result.scalars().all())


async def process_review(
    review: Review,
    pipeline: ABSAPipeline,
    db: AsyncSession,
) -> Review:
    """Run ABSA on a review and persist the aspect results."""
    if review.processed:
        return review

    result = await pipeline.analyze(review.body)

    for pred in result.aspects:
        ar = AspectResult(
            review_id=review.id,
            aspect=pred.aspect,
            sentiment=pred.sentiment,
            confidence=pred.confidence,
            opinion_phrase=pred.opinion_phrase or "",
        )
        db.add(ar)

    review.processed = True
    await db.flush()
    await db.refresh(review, ["aspect_results"])
    logger.info("Processed review %s — %d aspects", review.id, len(result.aspects))
    return review


async def process_unprocessed_batch(
    product_id: uuid.UUID,
    pipeline: ABSAPipeline,
    db: AsyncSession,
    batch_size: int = 16,
    redis: Redis | None = None,
) -> int:
    """Find unprocessed reviews and run ABSA on them in batches. Returns count processed.

    After processing, invalidates the Redis cache for this product so the
    dashboard summary and time-series reflect the newly added aspect results.
    """
    q = select(Review).where(
        Review.product_id == product_id,
        Review.processed == False,  # noqa: E712
    ).limit(batch_size)
    result = await db.execute(q)
    reviews = result.scalars().all()

    for review in reviews:
        await process_review(review, pipeline, db)

    if reviews and redis is not None:
        await invalidate_product_cache(redis, str(product_id))

    return len(reviews)