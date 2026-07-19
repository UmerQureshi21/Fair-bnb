"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import type { ValuateResult } from "./ResultDisplay";

const VectorPlot = dynamic(() => import("./VectorPlot"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] w-full items-center justify-center text-xs text-muted">
      Loading plot…
    </div>
  ),
});

type SavedValuation = {
  id: number;
  mode: "host" | "looking";
  fair_price: number | null;
  listed_price: number | null;
  result: ValuateResult;
  created_at: string;
};

function formatDate(isoLike: string): string {
  // Backend stores SQLite's datetime('now') as "YYYY-MM-DD HH:MM:SS" (UTC, no
  // timezone suffix) - browsers won't parse that as UTC without the "Z".
  const date = new Date(isoLike.replace(" ", "T") + "Z");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ValuationHistory({ refreshKey }: { refreshKey: number }) {
  const { status, authFetch } = useAuth();
  const [valuations, setValuations] = useState<SavedValuation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    let cancelled = false;

    async function load() {
      try {
        const res = await authFetch("/api/valuations");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setValuations(data.valuations);
      } catch {
        if (!cancelled) setError("Couldn't load your saved valuations.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, authFetch, refreshKey]);

  if (status !== "authed" || (valuations && valuations.length === 0)) return null;

  return (
    <div className="mt-10 w-full">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Saved valuations</p>

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

      {!error && !valuations && <p className="mt-2 text-sm text-muted">Loading…</p>}

      {valuations && valuations.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {valuations.map((v) => {
            const vectorPlot = v.result.vector_plot;
            const userMediaUrl = v.result.user_media_url;
            const fallbackThumbnail = v.result.top_matches?.[0]?.thumbnail;

            return (
              <div
                key={v.id}
                className="rounded-2xl border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-4">
                  {!vectorPlot && !userMediaUrl && (
                    <>
                      {fallbackThumbnail ? (
                        <img
                          src={fallbackThumbnail}
                          alt=""
                          className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-surface-alt" />
                      )}
                    </>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-tint-fg">
                        {v.mode === "host" ? "Host" : "Looking"}
                      </span>
                      <span className="text-xs text-muted">{formatDate(v.created_at)}</span>
                    </div>
                    <p className="mt-1 text-lg font-extrabold text-brand">
                      ${v.fair_price?.toFixed(0)}
                      <span className="text-xs font-semibold text-muted">/night</span>
                    </p>
                  </div>

                  {v.listed_price != null && (
                    <div
                      className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${
                        v.result.is_overpriced
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {v.result.is_overpriced ? "Overpriced" : "Good deal"}
                    </div>
                  )}
                </div>

                {(vectorPlot || userMediaUrl) && (
                  <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 md:flex-row">
                    <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                      {userMediaUrl && (
                        <div className="flex flex-col gap-1.5">
                          {v.result.user_media_type === "video" ? (
                            <video
                              src={userMediaUrl}
                              controls
                              muted
                              className="aspect-[4/3] w-full rounded-xl bg-surface-alt object-cover"
                            />
                          ) : (
                            <img
                              src={userMediaUrl}
                              alt="Your submission"
                              className="aspect-[4/3] w-full rounded-xl object-cover"
                            />
                          )}
                          <span className="truncate text-xs font-semibold text-fg">Your listing</span>
                        </div>
                      )}
                      {v.result.top_matches.map((match) => (
                        <div key={match.thumbnail} className="flex flex-col gap-1.5">
                          <img
                            src={match.thumbnail}
                            alt=""
                            className="aspect-[4/3] w-full rounded-xl object-cover"
                          />
                          <span className="truncate text-xs font-semibold text-fg">
                            ${match.price}/night
                          </span>
                          <span className="-mt-1 truncate text-[11px] text-muted">
                            {(match.similarity * 100).toFixed(0)}% match
                          </span>
                        </div>
                      ))}
                    </div>

                    {vectorPlot && (
                      <div className="flex-1 md:max-w-sm">
                        <VectorPlot
                          user={vectorPlot.user}
                          matches={v.result.top_matches.map((m, i) => ({
                            coords: vectorPlot.top_matches[i],
                            price: m.price,
                            similarity: m.similarity,
                          }))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
