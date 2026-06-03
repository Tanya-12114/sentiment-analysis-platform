"""
db/models.py — SQLAlchemy ORM table definitions.

Tables:
  - products       : catalogue of tracked products
  - reviews        : raw review text + metadata
  - aspect_results : extracted aspect-sentiment pairs per review
  - scrape_jobs    : background scraper run history
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------
class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    asin: Mapped[str | None] = mapped_column(String(20), unique=True)
    category: Mapped[str | None] = mapped_column(String(100))
    image_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="product", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------
class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("product_id", "external_id", name="uq_product_external"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    external_id: Mapped[str | None] = mapped_column(String(100))
    title: Mapped[str | None] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[float | None] = mapped_column(Float)
    reviewer_name: Mapped[str | None] = mapped_column(String(200))
    verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False)
    review_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source: Mapped[str] = mapped_column(String(50), default="manual")  # amazon | manual | api
    processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="reviews")
    aspect_results: Mapped[list["AspectResult"]] = relationship("AspectResult", back_populates="review", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# AspectResult
# ---------------------------------------------------------------------------
class AspectResult(Base):
    __tablename__ = "aspect_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), index=True)
    aspect: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    sentiment: Mapped[str] = mapped_column(String(20), nullable=False)   # positive | negative | neutral
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    opinion_phrase: Mapped[str | None] = mapped_column(String(500))       # the raw phrase that triggered this
    pipeline_version: Mapped[str] = mapped_column(String(20), default="1.0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    review: Mapped["Review"] = relationship("Review", back_populates="aspect_results")


# ---------------------------------------------------------------------------
# ScrapeJob
# ---------------------------------------------------------------------------
class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(20), default="pending")   # pending | running | done | failed
    reviews_found: Mapped[int] = mapped_column(Integer, default=0)
    reviews_new: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
