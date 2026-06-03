"""
api/products.py — Product CRUD endpoints.
"""

from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Product, Review
from app.db.session import get_db
from app.models.schemas import ProductCreate, ProductRead

router = APIRouter()


@router.get("/", response_model=List[ProductRead])
async def list_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).order_by(Product.name))
    products = result.scalars().all()

    # Attach review counts
    counts_q = await db.execute(
        select(Review.product_id, func.count(Review.id).label("cnt"))
        .group_by(Review.product_id)
    )
    counts = {row.product_id: row.cnt for row in counts_q}

    out = []
    for p in products:
        pr = ProductRead.model_validate(p)
        pr.review_count = counts.get(p.id, 0)
        out.append(pr)
    return out


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return ProductRead.model_validate(product)


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductRead.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
