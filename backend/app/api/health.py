"""api/health.py — Liveness and readiness probes."""

from fastapi import APIRouter, Request

from app.core.cache import redis_ping

router = APIRouter()


@router.get("/health/live")
async def liveness():
    """Simple liveness check — returns 200 if the process is running."""
    return {"status": "ok"}


@router.get("/health/ready")
async def readiness(request: Request):
    """
    Readiness check — verifies all critical dependencies are up:
      - NLP pipeline loaded
      - Redis reachable

    Container orchestrators (k8s, ECS) use this to decide whether to
    send traffic to the pod.
    """
    pipeline = getattr(request.app.state, "nlp_pipeline", None)
    pipeline_ready = pipeline is not None and pipeline.is_ready

    redis = getattr(request.app.state, "redis", None)
    redis_ready = await redis_ping(redis) if redis is not None else False

    all_ready = pipeline_ready and redis_ready

    return {
        "status": "ready" if all_ready else "loading",
        "pipeline": pipeline_ready,
        "redis": redis_ready,
    }