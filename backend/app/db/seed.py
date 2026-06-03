"""
db/seed.py — Populate the database with sample products and reviews.

Run with:  python -m app.db.seed
"""

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.db.session import AsyncSessionLocal, engine, Base
from app.db.models import Product, Review


SAMPLE_PRODUCTS = [
    {"name": "Sony WH-1000XM5", "asin": "B09XS7JWHH", "category": "Headphones"},
    {"name": "Samsung Galaxy S24", "asin": "B0CMD14J8T", "category": "Smartphones"},
    {"name": "MacBook Pro M3", "asin": "B0CM5JV268", "category": "Laptops"},
    {"name": "Dyson V15 Detect", "asin": "B09B3K5J4S", "category": "Vacuums"},
]

SAMPLE_REVIEWS = {
    "Sony WH-1000XM5": [
        ("The sound quality is absolutely phenomenal but the price is outrageous.", 4, True, "2024-11-02"),
        ("Battery life lasts forever and noise cancellation is best in class.", 5, True, "2024-11-15"),
        ("Incredibly comfortable for long sessions, build quality feels premium.", 5, False, "2024-12-01"),
        ("Connectivity keeps dropping and the app is buggy. Sound is still great.", 3, True, "2024-12-18"),
        ("Battery life is good but noise cancellation is mediocre vs Bose.", 3, True, "2025-01-07"),
        ("Best comfort I've experienced. Could wear these all day without fatigue.", 5, False, "2025-01-22"),
        ("The price is steep but sound quality justifies every penny spent.", 4, True, "2025-02-11"),
    ],
    "Samsung Galaxy S24": [
        ("Camera system is mind-blowing, especially night mode. Performance is snappy.", 5, True, "2024-10-05"),
        ("Battery life is disappointing for a flagship. Display looks gorgeous though.", 3, True, "2024-10-20"),
        ("Software experience is bloated with too many apps. Design is sleek.", 3, False, "2024-11-08"),
        ("Extremely overpriced. Camera is good but not $1200 good.", 2, True, "2024-11-25"),
        ("Performance screams through any task. Display is peak mobile display tech.", 5, True, "2024-12-10"),
        ("Battery barely lasts a workday. Software updates slow things down.", 2, False, "2025-01-03"),
    ],
    "MacBook Pro M3": [
        ("Performance is on another level. Battery life is genuinely all-day.", 5, True, "2024-10-12"),
        ("Display is stunning but the price is absolutely brutal.", 4, True, "2024-11-03"),
        ("Keyboard feels great. Missing ports is still frustrating in 2024.", 3, False, "2024-11-19"),
        ("Build quality is impeccable. Performance handles everything effortlessly.", 5, True, "2024-12-05"),
        ("Battery life exceeds expectations. Display is the best laptop screen I've seen.", 5, True, "2025-01-14"),
        ("The price is hard to swallow. Ports situation needs addressing urgently.", 3, False, "2025-02-01"),
    ],
    "Dyson V15 Detect": [
        ("Suction power is extraordinary. Battery life is adequate for most tasks.", 5, True, "2024-10-18"),
        ("Way too heavy for prolonged use. The attachments are versatile though.", 3, True, "2024-11-06"),
        ("Filtration is top tier. Incredibly noisy though, wakes up the whole house.", 4, False, "2024-11-28"),
        ("Price is through the roof. Suction power though is absolutely unmatched.", 4, True, "2024-12-14"),
        ("Battery lasts shorter than advertised. The weight makes long sessions tiring.", 2, True, "2025-01-09"),
        ("Attachments are genius. Filtration keeps allergens at bay beautifully.", 5, False, "2025-01-30"),
    ],
}


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for p_data in SAMPLE_PRODUCTS:
            existing = await db.scalar(select(Product).where(Product.asin == p_data["asin"]))
            if existing:
                continue
            product = Product(**p_data)
            db.add(product)
            await db.flush()

            for body, rating, verified, date_str in SAMPLE_REVIEWS.get(p_data["name"], []):
                review = Review(
                    product_id=product.id,
                    body=body,
                    rating=float(rating),
                    verified_purchase=verified,
                    review_date=datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc),
                    source="seed",
                )
                db.add(review)

        await db.commit()
        print("✓ Seed complete")


if __name__ == "__main__":
    asyncio.run(seed())
