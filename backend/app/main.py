"""
main.py — FastAPI application entry point.

Registers all routers, middleware, startup/shutdown hooks,
and the global exception handler.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import reviews, products, analysis, scraper, health
from app.core.cache import create_redis_client, close_redis_client
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import engine, Base
from app.pipelines.nlp_pipeline import ABSAPipeline


configure_logging()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan — runs at startup and shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---

    # 1. Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Connect to Redis
    try:
        app.state.redis = await create_redis_client()
    except Exception as exc:
        logger.warning("Redis unavailable at startup — caching disabled: %s", exc)
        app.state.redis = None

    # 3. Warm up the NLP pipeline
    try:
        app.state.nlp_pipeline = ABSAPipeline()
        await app.state.nlp_pipeline.load()
    except Exception as e:
        logger.warning("NLP pipeline skipped: %s", e)
        app.state.nlp_pipeline = None

    yield

    # --- Shutdown ---
    if app.state.redis is not None:
        await close_redis_client(app.state.redis)
    await engine.dispose()


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ABSA Dashboard API",
    description="Aspect-Based Sentiment Analysis for E-Commerce reviews",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router,    prefix="/api/v1",           tags=["health"])
app.include_router(products.router,  prefix="/api/v1/products",  tags=["products"])
app.include_router(reviews.router,   prefix="/api/v1/reviews",   tags=["reviews"])
app.include_router(analysis.router,  prefix="/api/v1/analysis",  tags=["analysis"])
app.include_router(scraper.router,   prefix="/api/v1/scraper",   tags=["scraper"])

# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Log full traceback server-side — never expose internals to the client
    logger.exception(
        "Unhandled exception on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )