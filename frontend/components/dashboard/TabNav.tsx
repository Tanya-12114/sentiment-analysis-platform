// components/dashboard/TabNav.tsx
// Horizontal tab bar for switching dashboard views

"use client";

import type { DashboardTab } from "@/types";

interface Tab {
  id: DashboardTab;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "overview",  label: "Overview",     icon: "⬡" },
  { id: "aspects",   label: "Aspects",      icon: "◈" },
  { id: "timeline",  label: "Timeline",     icon: "◷" },
  { id: "reviews",   label: "Reviews",      icon: "◻" },
  { id: "pipeline",  label: "NLP Pipeline", icon: "⟳" },
  { id: "analyze",   label: "Analyze Text", icon: "✦" },
];

interface Props {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

export function TabNav({ active, onChange }: Props) {
  return (
    <div className="flex gap-0.5 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-all duration-150 border-b-2 -mb-px ${
            active === t.id
              ? "border-violet-600 text-violet-600 dark:text-violet-400 font-medium"
              : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
