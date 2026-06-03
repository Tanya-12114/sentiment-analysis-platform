"""api/health.py — Liveness and readiness probes."""

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health/live")
async def liveness():
    return {"status": "ok"}


@router.get("/health/ready")
async def readiness(request: Request):
    pipeline = getattr(request.app.state, "nlp_pipeline", None)
    pipeline_ready = pipeline is not None and getattr(pipeline, "_loaded", False)
    return {
        "status": "ready" if pipeline_ready else "loading",
        "pipeline": pipeline_ready,
    }
