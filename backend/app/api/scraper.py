"""
api/scraper.py — Background scraper that fetches reviews from public sources.

Uses FastAPI BackgroundTasks so the endpoint returns immediately while
the scrape runs asynchronously. For production, swap BackgroundTasks
for a Celery worker.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import Review, ScrapeJob
from app.db.session import AsyncSessionLocal, get_db
from app.models.schemas import ScrapeJobCreate, ScrapeJobRead
from app.services.review_service import process_review

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@router.post("/jobs", response_model=ScrapeJobRead, status_code=202)
async def create_scrape_job(
    body: ScrapeJobCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Start a background scrape job for a product."""
    job = ScrapeJob(product_id=body.product_id, status="pending")
    db.add(job)
    await db.flush()
    await db.refresh(job)

    pipeline = request.app.state.nlp_pipeline
    background_tasks.add_task(_run_scrape_job, job.id, body.max_pages, pipeline)
    return job


@router.get("/jobs/{job_id}", response_model=ScrapeJobRead)
async def get_scrape_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Poll job status."""
    job = await db.get(ScrapeJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ---------------------------------------------------------------------------
# Background worker
# ---------------------------------------------------------------------------

async def _run_scrape_job(job_id: uuid.UUID, max_pages: int, pipeline) -> None:
    """
    Background task: scrape reviews, store them, run ABSA pipeline.

    In a real deployment this would call the Amazon Product Advertising API
    or a proxy scraping service. Here we simulate the HTTP fetch pattern
    with httpx and placeholder logic that can be swapped for real selectors.
    """
    async with AsyncSessionLocal() as db:
        job = await db.get(ScrapeJob, job_id)
        if not job:
            return

        job.status = "running"
        job.started_at = datetime.now(tz=timezone.utc)
        await db.commit()

        found = 0
        new_count = 0

        try:
            async with httpx.AsyncClient(
                headers={"User-Agent": settings.SCRAPER_USER_AGENT},
                timeout=10,
            ) as client:
                for page in range(1, max_pages + 1):
                    # ----------------------------------------------------------
                    # PLACEHOLDER: replace with real API call / HTML parsing
                    # e.g. Amazon PAAPI5, BestBuy API, scrapy spider, etc.
                    # ----------------------------------------------------------
                    raw_reviews = await _simulate_fetch(client, job.product_id, page)

                    for raw in raw_reviews:
                        found += 1
                        # Dedup by external_id
                        existing = await db.scalar(
                            select(Review).where(
                                Review.product_id == job.product_id,
                                Review.external_id == raw["external_id"],
                            )
                        )
                        if existing:
                            continue

                        review = Review(
                            product_id=job.product_id,
                            external_id=raw["external_id"],
                            body=raw["body"],
                            rating=raw.get("rating"),
                            reviewer_name=raw.get("reviewer_name"),
                            verified_purchase=raw.get("verified", False),
                            review_date=raw.get("date"),
                            source="scraper",
                        )
                        db.add(review)
                        await db.flush()

                        if pipeline and pipeline._loaded:
                            await process_review(review, pipeline, db)

                        new_count += 1

                    await asyncio.sleep(settings.SCRAPER_DELAY_SECONDS)

            job.status = "done"
        except Exception as exc:
            logger.exception("Scrape job %s failed", job_id)
            job.status = "failed"
            job.error_message = str(exc)
        finally:
            job.reviews_found = found
            job.reviews_new = new_count
            job.finished_at = datetime.now(tz=timezone.utc)
            await db.commit()


async def _simulate_fetch(
    client: httpx.AsyncClient,
    product_id: uuid.UUID,
    page: int,
) -> list[dict]:
    """
    Placeholder that returns synthetic review dicts.
    Swap this for real HTTP/HTML scraping logic.
    """
    await asyncio.sleep(0.1)  # simulate network latency
    return [
        {
            "external_id": f"sim_{product_id}_{page}_{i}",
            "body": f"Simulated review {page}-{i}: great product, performance is excellent.",
            "rating": 4.0 + (i % 2) * 0.5,
            "reviewer_name": f"User{page}{i}",
            "verified": i % 2 == 0,
            "date": datetime.now(tz=timezone.utc),
        }
        for i in range(3)
    ]
