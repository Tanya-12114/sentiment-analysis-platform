"""
pipelines/nlp_pipeline.py — Two-stage ABSA pipeline.

Stage 1 — spaCy dependency parsing
    Walks the dependency tree to find (noun-head, opinion-modifier) pairs.
    This gives us candidate aspect phrases without needing labelled training data.

Stage 2 — HuggingFace ABSA classifier
    Classifies each (review, aspect) pair as Positive / Negative / Neutral
    using a fine-tuned DeBERTa model trained on SemEval ABSA datasets.

The pipeline exposes a single async method `analyze(text)` safe for concurrent use
because model inference is dispatched to a thread pool via asyncio.to_thread().
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import List

logger = logging.getLogger(__name__)


@dataclass
class AspectPrediction:
    aspect: str
    sentiment: str          # "positive" | "negative" | "neutral"
    confidence: float
    opinion_phrase: str = ""


@dataclass
class PipelineResult:
    aspects: List[AspectPrediction] = field(default_factory=list)
    overall_sentiment: str = "neutral"
    processing_time_ms: float = 0.0

    @property
    def summary(self) -> str:
        if not self.aspects:
            return "No specific aspects detected."
        pos = sum(1 for a in self.aspects if a.sentiment == "positive")
        neg = sum(1 for a in self.aspects if a.sentiment == "negative")
        top = self.aspects[0]
        return (
            f"Found {len(self.aspects)} aspects. "
            f"{pos} positive, {neg} negative. "
            f"Top signal: {top.aspect} ({top.sentiment})."
        )


class ABSAPipeline:
    """
    Loads spaCy and the HuggingFace ABSA model once at startup,
    then processes reviews concurrently via asyncio.to_thread().
    """

    def __init__(self):
        self._nlp = None
        self._classifier = None
        self._loaded = False

    # ------------------------------------------------------------------
    # Startup
    # ------------------------------------------------------------------
    async def load(self):
        """Load models in a thread so we don't block the event loop."""
        await asyncio.to_thread(self._load_sync)
        self._loaded = True
        logger.info("ABSAPipeline loaded successfully")

    def _load_sync(self):
        import spacy
        from transformers import pipeline as hf_pipeline
        from app.core.config import settings

        logger.info("Loading spaCy model: %s", settings.SPACY_MODEL)
        try:
            self._nlp = spacy.load(settings.SPACY_MODEL)
        except OSError:
            # Fall back to smaller model if trf not installed
            logger.warning("Falling back to en_core_web_sm")
            self._nlp = spacy.load("en_core_web_sm")

        logger.info("Loading HuggingFace ABSA model: %s", settings.ABSA_MODEL_NAME)
        self._classifier = hf_pipeline(
            "text-classification",
            model=settings.ABSA_MODEL_NAME,
            tokenizer=settings.ABSA_MODEL_NAME,
            device=-1,          # CPU; change to 0 for GPU
            top_k=None,
        )

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------
    async def analyze(self, text: str) -> PipelineResult:
        """Run the full pipeline asynchronously."""
        return await asyncio.to_thread(self._analyze_sync, text)

    async def analyze_batch(self, texts: List[str]) -> List[PipelineResult]:
        """Process multiple reviews concurrently."""
        return await asyncio.gather(*[self.analyze(t) for t in texts])

    # ------------------------------------------------------------------
    # Synchronous internals (run inside to_thread)
    # ------------------------------------------------------------------
    def _analyze_sync(self, text: str) -> PipelineResult:
        t0 = time.perf_counter()

        aspects = self._extract_aspects_spacy(text)
        predictions = self._classify_sentiments(text, aspects)
        overall = self._compute_overall(predictions)

        elapsed = (time.perf_counter() - t0) * 1000
        return PipelineResult(aspects=predictions, overall_sentiment=overall, processing_time_ms=round(elapsed, 1))

    def _extract_aspects_spacy(self, text: str) -> List[str]:
        """
        Use dependency parsing to pull out noun phrases that are
        modified by opinion adjectives (amod, advmod) or are
        nsubj/dobj of opinion verbs.
        """
        doc = self._nlp(text)
        aspects = set()

        for token in doc:
            # Noun head with opinion modifier
            if token.pos_ == "NOUN" and any(
                child.dep_ in ("amod", "advmod") and child.pos_ in ("ADJ", "ADV")
                for child in token.children
            ):
                aspects.add(token.lemma_.lower())

            # Noun chunk heads as candidate aspects
            if token.dep_ in ("nsubj", "dobj", "nsubjpass") and token.pos_ == "NOUN":
                aspects.add(token.lemma_.lower())

        # Limit to the most salient 8 aspects to keep inference fast
        return list(aspects)[:8]

    def _classify_sentiments(self, text: str, aspects: List[str]) -> List[AspectPrediction]:
        if not aspects or self._classifier is None:
            return []

        # ABSA model format: "[CLS] aspect [SEP] review [SEP]"
        inputs = [f"[CLS] {aspect} [SEP] {text} [SEP]" for aspect in aspects]
        results = []

        try:
            raw_outputs = self._classifier(inputs, truncation=True, max_length=512)
            for aspect, scores_list in zip(aspects, raw_outputs):
                # scores_list is a list of {label, score} dicts
                best = max(scores_list, key=lambda x: x["score"])
                label = best["label"].lower()
                # Normalise labels from various model formats
                if "pos" in label:
                    sentiment = "positive"
                elif "neg" in label:
                    sentiment = "negative"
                else:
                    sentiment = "neutral"

                results.append(AspectPrediction(
                    aspect=aspect,
                    sentiment=sentiment,
                    confidence=round(best["score"], 4),
                ))
        except Exception as exc:
            logger.error("Classifier error: %s", exc)

        return results

    @staticmethod
    def _compute_overall(predictions: List[AspectPrediction]) -> str:
        if not predictions:
            return "neutral"
        pos = sum(1 for p in predictions if p.sentiment == "positive")
        neg = sum(1 for p in predictions if p.sentiment == "negative")
        if pos > neg * 1.5:
            return "positive"
        if neg > pos * 1.5:
            return "negative"
        return "mixed"
