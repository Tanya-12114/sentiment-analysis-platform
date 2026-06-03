// components/pipeline/ScraperPanel.tsx
// UI for triggering and monitoring background scrape jobs

"use client";

import type { ScrapeJob } from "@/types";

interface Props {
  job: ScrapeJob | null;
  starting: boolean;
  onStart: () => void;
}

function StatusBadge({ status }: { status: ScrapeJob["status"] }) {
  const cfg: Record<ScrapeJob["status"], string> = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    running: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    done:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed:  "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${cfg[status]}`}>
      {status === "running" && <span className="mr-1 animate-spin inline-block">⟳</span>}
      {status}
    </span>
  );
}

export function ScraperPanel({ job, starting, onStart }: Props) {
  const isActive = job?.status === "pending" || job?.status === "running";
  const progress = job
    ? Math.min((job.reviews_found / Math.max(job.reviews_found + 3, 15)) * 100, 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Background Scraper Worker
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Fetches reviews from public APIs and feeds the NLP pipeline
          </p>
        </div>

        <button
          onClick={onStart}
          disabled={starting || isActive}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            starting || isActive
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <span>{isActive ? "⟳" : "↓"}</span>
          {starting ? "Starting…" : isActive ? "Scraping…" : "Fetch reviews"}
        </button>
      </div>

      {/* Job status */}
      {job && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={job.status} />
            <span className="text-xs text-gray-400 font-mono">
              Job {job.id.slice(0, 8)}…
            </span>
            {job.started_at && (
              <span className="text-xs text-gray-400">
                Started {new Date(job.started_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {(job.status === "running" || job.status === "done") && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Reviews found</span>
                <span>{job.reviews_found} ({job.reviews_new} new)</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          {job.status === "done" && (
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { label: "Found", value: job.reviews_found },
                { label: "New", value: job.reviews_new },
                { label: "Duplicate", value: job.reviews_found - job.reviews_new },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {job.status === "failed" && job.error_message && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">
              Error: {job.error_message}
            </p>
          )}
        </div>
      )}

      {!job && !starting && (
        <p className="text-xs text-gray-400 text-center py-4">
          No active jobs — click "Fetch reviews" to start a scrape run.
        </p>
      )}
    </div>
  );
}
