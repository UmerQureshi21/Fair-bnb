"use client";

import { RequireAuth } from "@/components/RequireAuth";

export default function GamesPage() {
  return (
    <RequireAuth>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <span className="text-4xl">🎮</span>
        <h1 className="text-2xl font-extrabold text-fg">Games coming soon</h1>
        <p className="max-w-sm text-sm text-muted">
          We&apos;re building games around your saved hotel comparisons and vectors
          &mdash; guess the price, spot the match, that kind of thing. Check back soon.
        </p>
      </div>
    </RequireAuth>
  );
}
