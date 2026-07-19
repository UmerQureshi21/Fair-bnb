"use client";

import { useState } from "react";
import type { Mode } from "./ModeToggle";

export type ValuateMatch = { price: number; similarity: number; thumbnail: string; url: string };
export type ValuateResult = {
  fair_price: number;
  low_confidence: boolean;
  top_matches: ValuateMatch[];
  worst_matches: ValuateMatch[];
  listed_price?: number;
  overcharge_amount?: number;
  overcharge_percent?: number;
  is_overpriced?: boolean;
};

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ResultDisplay({ mode, result }: { mode: Mode; result: ValuateResult }) {
  const [showWorst, setShowWorst] = useState(false);

  return (
    <div className="w-full rounded-3xl border border-border bg-surface p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {mode === "host" ? "Fair price for your room" : "Fair price for this listing"}
      </p>
      <p className="mt-1 text-4xl font-extrabold text-brand">
        ${result.fair_price.toFixed(0)}
        <span className="text-lg font-semibold text-muted">/night</span>
      </p>

      {result.listed_price !== undefined && (
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
            result.is_overpriced
              ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {result.is_overpriced
            ? `You're being overcharged by $${Math.abs(result.overcharge_amount ?? 0).toFixed(0)}/night (${Math.abs(result.overcharge_percent ?? 0).toFixed(0)}% above fair price).`
            : `Good deal — this listing is priced $${Math.abs(result.overcharge_amount ?? 0).toFixed(0)}/night below fair value.`}
        </div>
      )}

      {result.low_confidence && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
          Low confidence — the closest hotels we found near this location aren&apos;t
          very visually similar, so this estimate may not be reliable.
        </p>
      )}

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
        Closest matching hotels
      </p>
      <p className="mt-1 text-xs text-muted">Click a hotel to view or book it on Stay22.</p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {result.top_matches.map((match) => (
          <a
            key={match.thumbnail}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-2xl border border-border transition hover:border-brand hover:shadow-lg"
          >
            <div className="relative">
              <img src={match.thumbnail} alt="" className="h-auto w-full object-contain" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                View on Stay22 →
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-fg">${match.price}/night</p>
              <p className="text-xs text-muted">{(match.similarity * 100).toFixed(0)}% match</p>
            </div>
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowWorst((v) => !v)}
        className="mt-6 flex w-full items-center justify-between gap-2 border-t border-border pt-4 text-left"
      >
        <span>
          <span className="block text-xs font-bold uppercase tracking-wide text-muted">
            Least similar hotels nearby
          </span>
          <span className="mt-1 block text-xs text-muted">
            For comparison — these didn&apos;t make the cut, so you can see the matching actually works.
          </span>
        </span>
        <ChevronIcon
          className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${showWorst ? "rotate-180" : ""}`}
        />
      </button>

      {showWorst && (
        <div className="mt-3 grid grid-cols-1 gap-4 opacity-60 sm:grid-cols-3">
          {result.worst_matches.map((match) => (
            <div key={match.thumbnail} className="overflow-hidden rounded-2xl border border-border">
              <img src={match.thumbnail} alt="" className="h-auto w-full object-contain grayscale" />
              <div className="p-3">
                <p className="text-sm font-bold text-fg">${match.price}/night</p>
                <p className="text-xs text-muted">{(match.similarity * 100).toFixed(0)}% match</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
