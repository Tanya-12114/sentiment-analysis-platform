"""
main.py — FastAPI application entry point.

Registers all routers, middleware, startup/shutdown hooks,
and the global exception handler.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import reviews, products, analysis, scraper, health
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import engine, Base
from app.pipelines.nlp_pipeline import ABSAPipeline


configure_logging()

# ---------------------------------------------------------------------------
# Lifespan — runs at startup and shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and warm up the NLP pipeline
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    app.state.nlp_pipeline = ABSAPipeline()
    await app.state.nlp_pipeline.load()

    yield

    # Shutdown: close DB connections
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
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )
