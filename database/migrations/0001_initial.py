"""Initial schema — create all tables

Revision ID: 0001_initial
Revises: —
Create Date: 2025-01-01 00:00:00
"""

from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("asin", sa.String(20), unique=True, nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("image_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_products_name", "products", ["name"])

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("external_id", sa.String(100), nullable=True),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("rating", sa.Float, nullable=True),
        sa.Column("reviewer_name", sa.String(200), nullable=True),
        sa.Column("verified_purchase", sa.Boolean, default=False),
        sa.Column("review_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(50), default="manual"),
        sa.Column("processed", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("product_id", "external_id", name="uq_product_external"),
    )
    op.create_index("ix_reviews_product_id", "reviews", ["product_id"])
    op.create_index("ix_reviews_processed", "reviews", ["processed"])

    op.create_table(
        "aspect_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("aspect", sa.String(200), nullable=False),
        sa.Column("sentiment", sa.String(20), nullable=False),
        sa.Column("confidence", sa.Float, nullable=False),
        sa.Column("opinion_phrase", sa.String(500), nullable=True),
        sa.Column("pipeline_version", sa.String(20), default="1.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_aspect_results_review_id", "aspect_results", ["review_id"])
    op.create_index("ix_aspect_results_aspect", "aspect_results", ["aspect"])

    op.create_table(
        "scrape_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), default="pending"),
        sa.Column("reviews_found", sa.Integer, default=0),
        sa.Column("reviews_new", sa.Integer, default=0),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("scrape_jobs")
    op.drop_table("aspect_results")
    op.drop_table("reviews")
    op.drop_table("products")
