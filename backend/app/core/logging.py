"""
core/logging.py — Structured logging configuration.

In production, replace the StreamHandler with a JSON handler
(e.g. python-json-logger) and ship logs to Datadog / CloudWatch.
"""

import logging
import sys


def configure_logging(level: str = "INFO") -> None:
    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format=fmt,
        datefmt=datefmt,
        stream=sys.stdout,
        force=True,
    )

    # Quiet noisy third-party loggers
    for noisy in ("httpx", "httpcore", "transformers", "torch"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
