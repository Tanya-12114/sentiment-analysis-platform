// components/pipeline/PipelineVisualizer.tsx
// Animated step-by-step visualization of the NLP pipeline

"use client";

import { useState, useRef } from "react";

interface Stage {
  id: string;
  label: string;
  description: string;
  tech: string;
  color: string;
  bgColor: string;
}

const STAGES: Stage[] = [
  {
    id: "fetch",
    label: "Review Fetch",
    description: "httpx async client pulls reviews from API or scraper queue with deduplication.",
    tech: "httpx + Celery",
    color: "text-violet-700 dark:text-violet-300",
    bgColor: "bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800",
  },
  {
    id: "tokenize",
    label: "Tokenisation",
    description: "BPE tokenizer splits raw text into subword units preserving punctuation context.",
    tech: "HuggingFace Tokenizer",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  },
  {
    id: "pos",
    label: "POS Tagging",
    description: "spaCy transformer model assigns part-of-speech tags: NN, JJ, VB, RB…",
    tech: "spaCy en_core_web_trf",
    color: "text-sky-700 dark:text-sky-300",
    bgColor: "bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800",
  },
  {
    id: "dep",
    label: "Dependency Parse",
    description: "Builds syntactic tree to link opinion adjectives (amod/advmod) to their noun heads.",
    tech: "spaCy dep parser",
    color: "text-teal-700 dark:text-teal-300",
    bgColor: "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800",
  },
  {
    id: "extract",
    label: "Aspect Extraction",
    description: "Noun lemmas with opinion modifiers are collected as candidate aspect terms.",
    tech: "Rule + neural hybrid",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "classify",
    label: "Sentiment Classify",
    description: 'Fine-tuned DeBERTa model scores each [CLS] aspect [SEP] review [SEP] pair.',
    tech: "yangheng/deberta-v3-base-absa",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
  },
  {
    id: "aggregate",
    label: "Aggregate & Store",
    description: "Pandas + NumPy aggregate counts and scores; results persisted to PostgreSQL.",
    tech: "Pandas / SQLAlchemy",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
  },
];

interface Props {
  onRunComplete?: () => void;
}

export function PipelineVisualizer({ onRunComplete }: Props) {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runPipeline = () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setActiveStep(0);
    let step = 0;

    timerRef.current = setInterval(() => {
      step++;
      if (step >= STAGES.length) {
        clearInterval(timerRef.current!);
        setActiveStep(STAGES.length);
        setRunning(false);
        setDone(true);
        onRunComplete?.();
      } else {
        setActiveStep(step);
      }
    }, 550);
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveStep(-1);
    setRunning(false);
    setDone(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={runPipeline}
          disabled={running}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-all ${
            running
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700 hover:bg-violet-100"
          }`}
        >
          <span>{running ? "⟳" : "▶"}</span>
          {running ? "Running pipeline…" : "Run pipeline"}
        </button>

        {(done || activeStep >= 0) && (
          <button
            onClick={reset}
            className="px-4 py-2.5 rounded-lg text-base text-gray-400 hover:text-gray-600 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            Reset
          </button>
        )}

        {done && (
          <span className="text-base text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            ✓ Pipeline complete
          </span>
        )}
      </div>

      {/* Stage flow */}
      <div className="flex flex-wrap gap-2 items-center">
        {STAGES.map((stage, i) => {
          const isDone = activeStep > i;
          const isActive = activeStep === i;

          return (
            <div key={stage.id} className="flex items-center gap-2">
              <div
                className={`flex flex-col items-center gap-1.5 px-3.5 py-3 rounded-xl border text-center transition-all duration-300 min-w-[100px] ${
                  isDone
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : isActive
                    ? stage.bgColor + " shadow-sm scale-105"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isDone
                      ? "text-emerald-700 dark:text-emerald-300"
                      : isActive
                      ? stage.color
                      : "text-gray-400"
                  }`}
                >
                  {isDone ? "✓ " : isActive ? "⟳ " : `${i + 1}. `}
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`w-4 h-0.5 transition-all duration-500 ${
                    isDone ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage detail card */}
      {activeStep >= 0 && activeStep < STAGES.length && (
        <div
          className={`p-5 rounded-xl border ${STAGES[activeStep]?.bgColor ?? ""} transition-all duration-300`}
        >
          <p className={`text-base font-semibold mb-1.5 ${STAGES[activeStep]?.color}`}>
            Stage {activeStep + 1} — {STAGES[activeStep]?.label}
          </p>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-3">
            {STAGES[activeStep]?.description}
          </p>
          <span className="text-sm bg-white/60 dark:bg-black/20 px-2.5 py-1 rounded font-mono text-gray-500 dark:text-gray-400">
            {STAGES[activeStep]?.tech}
          </span>
        </div>
      )}

      {/* Architecture overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
        {STAGES.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4"
          >
            <p className={`text-sm font-bold mb-1.5 ${s.color}`}>{s.label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">
              {s.description}
            </p>
            <code className="text-sm text-gray-400 font-mono">{s.tech}</code>
          </div>
        ))}
      </div>
    </div>
  );
}