"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { type Card, loadGamePool } from "@/lib/gamePool";

type Round = { options: Card[]; oddIndex: number };

/**
 * Finds 3 similarly-priced cards plus 1 clear price outlier. Sorts by price,
 * scores every (3-card window, outside candidate) pair by how large the
 * outlier's gap is relative to the window's own spread, then picks randomly
 * among the best-scoring pairs so rounds vary instead of always the same
 * most-extreme combination.
 */
function pickRound(pool: Card[]): Round | null {
  if (pool.length < 4) return null;
  const sorted = [...pool].sort((a, b) => a.price - b.price);
  const n = sorted.length;

  const candidates: { clusterStart: number; outlierIdx: number; ratio: number }[] = [];

  for (let i = 0; i <= n - 3; i++) {
    const clusterMin = sorted[i].price;
    const clusterMax = sorted[i + 2].price;
    const clusterSpread = Math.max(clusterMax - clusterMin, 1);

    for (let j = 0; j < n; j++) {
      if (j >= i && j <= i + 2) continue;
      const gap = sorted[j].price > clusterMax ? sorted[j].price - clusterMax : clusterMin - sorted[j].price;
      if (gap <= 0) continue;
      candidates.push({ clusterStart: i, outlierIdx: j, ratio: gap / clusterSpread });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.ratio - a.ratio);
  const top = candidates.slice(0, Math.max(1, Math.ceil(candidates.length * 0.2)));
  const chosen = top[Math.floor(Math.random() * top.length)];

  const options = [
    sorted[chosen.clusterStart],
    sorted[chosen.clusterStart + 1],
    sorted[chosen.clusterStart + 2],
    sorted[chosen.outlierIdx],
  ];
  for (let k = options.length - 1; k > 0; k--) {
    const r = Math.floor(Math.random() * (k + 1));
    [options[k], options[r]] = [options[r], options[k]];
  }
  const oddIndex = options.findIndex((c) => c.key === sorted[chosen.outlierIdx].key);

  return { options, oddIndex };
}

function OptionCard({
  card,
  revealed,
  isOdd,
  isPicked,
  disabled,
  onClick,
}: {
  card: Card;
  revealed: boolean;
  isOdd: boolean;
  isPicked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const highlight = revealed && isOdd ? "correct" : revealed && isPicked ? "wrong" : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col overflow-hidden rounded-3xl border-2 bg-surface text-left transition-colors disabled:cursor-not-allowed ${
        highlight === "correct"
          ? "border-emerald-500"
          : highlight === "wrong"
            ? "border-red-500"
            : "border-border hover:border-brand"
      }`}
    >
      <img src={card.image} alt="" className="aspect-[4/3] w-full object-cover" />
      <div className="p-3 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{card.label}</p>
        <p className="mt-1 text-xl font-extrabold text-brand">
          {revealed ? `$${card.price.toFixed(0)}` : "?"}
          {revealed && <span className="text-xs font-semibold text-muted">/night</span>}
        </p>
      </div>
    </button>
  );
}

export function OddOneOutGame({ onExit }: { onExit: () => void }) {
  const { user, authFetch } = useAuth();
  const [pool, setPool] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<"playing" | "revealed" | "gameover">("playing");

  const bestKey = user ? `fairbnb_oddoneout_best_${user.id}` : null;

  useEffect(() => {
    setBest(bestKey ? Number(localStorage.getItem(bestKey) ?? 0) : 0);
  }, [bestKey]);

  const startRound = useCallback((poolArg: Card[]) => {
    setRound(pickRound(poolArg));
    setPickedIndex(null);
    setStatus("playing");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cards = await loadGamePool(authFetch, 4);
        if (cancelled) return;
        setPool(cards);
        if (cards.length >= 4) startRound(cards);
      } catch {
        if (!cancelled) setError("Couldn't load your saved valuations.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authFetch, startRound]);

  function handlePick(index: number) {
    if (!round || status !== "playing") return;
    setPickedIndex(index);
    setStatus("revealed");

    const correct = index === round.oddIndex;
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > best) {
        setBest(newStreak);
        if (bestKey) localStorage.setItem(bestKey, String(newStreak));
      }
      setTimeout(() => {
        if (pool) startRound(pool);
      }, 1100);
    } else {
      setTimeout(() => setStatus("gameover"), 1100);
    }
  }

  function playAgain() {
    if (!pool || pool.length < 4) return;
    setStreak(0);
    startRound(pool);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">Odd One Out</h1>
          <p className="mt-1 text-sm text-muted">
            Three of these are priced close together. Find the one that isn&apos;t.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-4 text-right">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Streak</p>
            <p className="text-2xl font-extrabold text-brand">{streak}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Best</p>
            <p className="text-2xl font-extrabold text-fg">{best}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            type="button"
            onClick={onExit}
            className="mt-3 rounded-2xl border border-border-strong px-6 py-2.5 text-sm font-bold text-fg transition hover:border-brand hover:text-brand"
          >
            Back to games
          </button>
        </div>
      )}

      {!error && pool === null && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {pool !== null && pool.length < 4 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted">
          <p>
            Not enough saved data to play yet.{" "}
            <Link href="/valuate" className="font-semibold text-brand hover:underline">
              Save a couple more valuations
            </Link>{" "}
            first.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-4 rounded-2xl border border-border-strong px-6 py-2.5 text-sm font-bold text-fg transition hover:border-brand hover:text-brand"
          >
            Back to games
          </button>
        </div>
      )}

      {pool !== null && pool.length >= 4 && !round && (
        <p className="mt-6 text-sm text-muted">
          Couldn&apos;t find a clear odd one out in your saved data yet - save a wider mix of prices and try
          again.
        </p>
      )}

      {round && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            {round.options.map((card, i) => (
              <OptionCard
                key={card.key}
                card={card}
                revealed={status !== "playing"}
                isOdd={i === round.oddIndex}
                isPicked={i === pickedIndex}
                disabled={status !== "playing"}
                onClick={() => handlePick(i)}
              />
            ))}
          </div>

          {status === "gameover" && (
            <div className="mt-4 rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-lg font-bold text-fg">Game over — streak of {streak}</p>
              <div className="mt-3 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={playAgain}
                  className="rounded-2xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-hover"
                >
                  Play again
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-2xl border border-border-strong px-6 py-2.5 text-sm font-bold text-fg transition hover:border-brand hover:text-brand"
                >
                  Back to games
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
