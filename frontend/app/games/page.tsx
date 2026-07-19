"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { GameModal } from "@/components/GameModal";
import { HigherLowerGame } from "@/components/HigherLowerGame";
import { OddOneOutGame } from "@/components/OddOneOutGame";

function HigherLowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" />
    </svg>
  );
}

function OddOneOutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

type GameId = "higher-lower" | "odd-one-out";

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  return (
    <RequireAuth>
      <div className="mx-4 mt-8 mb-14 sm:mx-10">
        <h1 className="text-2xl font-extrabold text-fg">Games</h1>
        <p className="mt-1 text-sm text-muted">
          Play with your saved hotel comparisons. More games coming soon.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveGame("higher-lower")}
            className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left shadow-lg transition hover:border-brand"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand">
              <HigherLowerIcon className="h-5 w-5" />
            </span>
            <span className="text-base font-bold text-fg">Higher or Lower</span>
            <span className="text-sm text-muted">
              Guess whether the next hotel is priced higher or lower. Keep your streak alive.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame("odd-one-out")}
            className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left shadow-lg transition hover:border-brand"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand">
              <OddOneOutIcon className="h-5 w-5" />
            </span>
            <span className="text-base font-bold text-fg">Odd One Out</span>
            <span className="text-sm text-muted">
              Four hotels, one priced way off from the rest. Spot it before your streak ends.
            </span>
          </button>
        </div>
      </div>

      {activeGame === "higher-lower" && (
        <GameModal>
          <HigherLowerGame onExit={() => setActiveGame(null)} />
        </GameModal>
      )}

      {activeGame === "odd-one-out" && (
        <GameModal>
          <OddOneOutGame onExit={() => setActiveGame(null)} />
        </GameModal>
      )}
    </RequireAuth>
  );
}
