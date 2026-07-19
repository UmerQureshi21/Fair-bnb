"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { type Card, buildPool, pickRandom } from "@/lib/gamePool";

function CardView({
  card,
  revealed,
  highlight,
}: {
  card: Card;
  revealed: boolean;
  highlight?: "correct" | "wrong";
}) {
  return (
    <div
      className={`flex flex-1 flex-col overflow-hidden rounded-3xl border-2 bg-surface transition-colors ${
        highlight === "correct"
          ? "border-emerald-500"
          : highlight === "wrong"
            ? "border-red-500"
            : "border-border"
      }`}
    >
      <img src={card.image} alt="" className="aspect-[4/3] w-full object-cover" />
      <div className="p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{card.label}</p>
        <p className="mt-1 text-3xl font-extrabold text-brand">
          {revealed ? `$${card.price.toFixed(0)}` : "?"}
          {revealed && <span className="text-sm font-semibold text-muted">/night</span>}
        </p>
      </div>
    </div>
  );
}

export function HigherLowerGame({ onExit }: { onExit: () => void }) {
  const { user, authFetch } = useAuth();
  const [pool, setPool] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Card | null>(null);
  const [challenger, setChallenger] = useState<Card | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong" | "gameover">("playing");

  // Namespaced per user id - a shared/public browser must never show one
  // account's best streak to a different account that logs in afterward.
  const bestKey = user ? `fairbnb_higherlower_best_${user.id}` : null;

  useEffect(() => {
    setBest(bestKey ? Number(localStorage.getItem(bestKey) ?? 0) : 0);
  }, [bestKey]);

  const startRound = useCallback((base: Card, usedKeys: Set<string>, poolArg: Card[]) => {
    setCurrent(base);
    setChallenger(pickRandom(poolArg, usedKeys));
    setStatus("playing");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await authFetch("/api/valuations");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const cards = buildPool(data.valuations);
        if (cancelled) return;
        setPool(cards);
        if (cards.length >= 2) {
          const first = cards[Math.floor(Math.random() * cards.length)];
          startRound(first, new Set([first.key]), cards);
        }
      } catch {
        if (!cancelled) setError("Couldn't load your saved valuations.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authFetch, startRound]);

  function handleGuess(direction: "higher" | "lower") {
    if (!current || !challenger || status !== "playing" || !pool) return;

    const correct =
      direction === "higher" ? challenger.price >= current.price : challenger.price <= current.price;
    setStatus(correct ? "correct" : "wrong");

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > best) {
        setBest(newStreak);
        if (bestKey) localStorage.setItem(bestKey, String(newStreak));
      }
      setTimeout(() => startRound(challenger, new Set([current.key, challenger.key]), pool), 900);
    } else {
      setTimeout(() => setStatus("gameover"), 900);
    }
  }

  function playAgain() {
    if (!pool || pool.length < 2) return;
    setStreak(0);
    const first = pool[Math.floor(Math.random() * pool.length)];
    startRound(first, new Set([first.key]), pool);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">Higher or Lower</h1>
          <p className="mt-1 text-sm text-muted">
            Guess whether the next place is priced higher or lower per night.
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

      {pool !== null && pool.length < 2 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted">
          <p>
            Not enough saved data to play yet.{" "}
            <Link href="/valuate" className="font-semibold text-brand hover:underline">
              Save a couple of valuations
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

      {current && challenger && (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CardView card={current} revealed />

            <div className="flex flex-col gap-3">
              <CardView
                card={challenger}
                revealed={status !== "playing"}
                highlight={
                  status === "correct" ? "correct" : status === "wrong" || status === "gameover" ? "wrong" : undefined
                }
              />

              {status === "playing" && (
                <>
                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
                    Is this one higher or lower?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleGuess("higher")}
                      className="flex-1 rounded-2xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
                    >
                      Higher ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGuess("lower")}
                      className="flex-1 rounded-2xl border border-border-strong py-3 text-sm font-bold text-fg transition hover:border-brand hover:text-brand"
                    >
                      Lower ↓
                    </button>
                  </div>
                </>
              )}
            </div>
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
