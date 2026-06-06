// components/dashboard/ProductSelector.tsx
// Pill-button group for switching between tracked products

"use client";

import type { Product } from "@/types";

interface Props {
  products: Product[];
  activeId: string | null;
  onChange: (id: string) => void;
  loading?: boolean;
}

export function ProductSelector({ products, activeId, onChange, loading }: Props) {
  if (loading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 w-40 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 flex-wrap">
      {products.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`px-5 py-2 rounded-lg text-base transition-all duration-150 border font-medium ${
            activeId === p.id
              ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700 font-semibold"
              : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          {p.name}
          <span className="ml-2 text-sm opacity-60">({p.review_count})</span>
        </button>
      ))}
    </div>
  );
}